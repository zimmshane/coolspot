const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const { MongoClient, ObjectId} = require('mongodb');
const { OAuth2Client } = require('google-auth-library');
const helmet = require('helmet');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const validator = require('validator');

// Load .env 
require('dotenv').config({ 
  path: path.join(__dirname, '../back.env') 
});
const requiredVars = ['MONGODB_URI', 'GOOGLE_CLIENT_ID'];
const missing = requiredVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
console.log('Environment variables loaded successfully');
console.log('.env path:', path.join(__dirname, '../back.env'));

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = process.env.PORT || 3001;
const dbName = process.env.DB_NAME || 'SpotDB';
const app = express();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
const client = new MongoClient(MONGODB_URI);
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

let db;

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests' }
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api/', generalLimiter);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));


async function connectToDb() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials

    await client.connect();

    // Test the connection
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB ping successful');

    db = client.db(dbName);
    console.log('Connected to database:', dbName);

    // Test collection access
    const testWrite = await db.collection('users').findOne({}, { limit: 1 });
    console.log('Collection access test:', testWrite ? 'successful' : 'empty collection');

    // Create indexes
    await createIndexes();
    console.log('Database indexes created');

  } catch (err) {
    console.error('MongoDB connection error details:');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  }
}

//START server
connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('Database ready for operations');
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


// Graceful shutdown
process.on('SIGTERM', async () => {
  await client.close();
  process.exit(0);
});


const sessions = new Map();
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many auth attempts' }
});

//google auth request
app.post('/auth/google', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Store/update user
    const user = await db.collection('users').findOneAndUpdate(
      { googleId},
      { 
        $set: { email, name, picture, firstLogin: new Date(), lastLogin: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Generate secure session
    const sessionId = generateSessionId();
    const sessionData = {
      userId: user._id.toString(),
      googleId,
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    sessions.set(sessionId, sessionData);

    // Set secure cookie
    res.cookie('sessionId', sessionId, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        picture: user.picture 
      }, 
      success: true 
    });

  } catch (error) {
    console.error('Auth error:', error.message);

    // Don't leak internal errors
    if (error.message.includes('Token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    res.status(500).json({ error: 'Authentication failed' });
  }
});


  // Session validation
function validateSession(req, res, next) {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = sessions.get(sessionId);

  if (!session || session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    res.clearCookie('sessionId');
    return res.status(401).json({ error: 'Session expired' });
  }

  req.user = session;
  next();
}

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('sessionId');
  res.json({ success: true });
});

// Protected route example
app.get('/api/profile', validateSession, (req, res) => {
  res.json({ user: req.user });
});


//SPOTS API


const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 comments per 5 minutes
  message: { error: 'Too many comments, slow down' }
});

const likeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 like actions per minute
  message: { error: 'Too many like actions' }
});

//Get spots within bounding box
app.get('/api/spots/bbox', async (req, res) => {
  const { minLng, minLat, maxLng, maxLat } = req.query;

  try {
    const spots = await db.collection('spots').find({
      visible: true,
      coordinates: {
        $geoWithin: {
          $box: [[parseFloat(minLng), parseFloat(minLat)], 
                 [parseFloat(maxLng), parseFloat(maxLat)]]
        }
      }
    }).toArray();

    res.json(spots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

//Get specific spot by ID
app.get('/api/spots/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');

    // Handle both ObjectId and numeric id formats
    let query;
    if (ObjectId.isValid(req.params.id)) {
      query = { _id: new ObjectId(req.params.id) };
    } else {
      query = { id: parseInt(req.params.id) };
    }

    const spot = await db.collection('spots').findOne(query);

    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    res.json(spot);
  } catch (error) {
    console.error('Error fetching spot:', error);
    res.status(500).json({ error: 'Failed to fetch spot' });
  }
});

// Search spots by name
app.get('/api/spots/search/:name',
  generalLimiter,
  [
    param('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Search term must be 1-50 characters')
      .matches(/^[a-zA-Z0-9\s\-_'.,!()&]+$/)
      .withMessage('Search contains invalid characters')
  ],
  validateAndSanitize,
  async (req, res) => {
    try {
      const searchTerm = validator.escape(req.params.name.trim());

      // Use regex instead of $text to avoid injection
      const spots = await db.collection('spots')
        .find({
          visible: true,
          name: { $regex: searchTerm, $options: 'i' }
        })
        .limit(20) // Prevent large result sets
        .toArray();

      res.json(spots);
    } catch (error) {
      console.error('Error searching spots:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

//Add new spot
app.post('/api/spots', 
  validateSession,
  generalLimiter,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters')
      .matches(/^[a-zA-Z0-9\s\-_'.,!()&]+$/)
      .withMessage('Name contains invalid characters'),
    body('coordinates')
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be array of 2 numbers'),
    body('coordinates.*')
      .isFloat()
      .withMessage('Coordinates must be numbers'),
    body('type')
      .optional()
      .isIn(['landmark', 'cafe', 'park', 'study', 'food', 'general'])
      .withMessage('Invalid spot type')
  ],
  validateAndSanitize,
  async (req, res) => {
    try {
      const { name, coordinates, type } = req.body;

      // Additional coordinate validation
      const [lng, lat] = coordinates.map(coord => parseFloat(coord));
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return res.status(400).json({ error: 'Invalid coordinates range' });
      }

      // Sanitize HTML content
      const sanitizedName = DOMPurify.sanitize(name, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });

      // Check for duplicate spots at same location
      // Currently broken :(
     /*  const existingSpot = await db.collection('spots').findOne({
        coordinates: { $geoWithin: { $centerSphere: [[lng, lat], 0.000001] } }, // ~1 meter radius
        visible: true
      });

      if (existingSpot) {
        return res.status(409).json({ error: 'Spot already exists at this location' });
      }
     */
      const newSpot = {
        name: sanitizedName,
        coordinates: [lng, lat],
        type: type || 'general',
        creator_id: req.user.googleId,
        created_on: new Date(),
        visible: true
      };

      const result = await db.collection('spots').insertOne(newSpot);
      res.status(201).json({ ...newSpot, _id: result.insertedId });

    } catch (error) {
      console.error('Error creating spot:', error);
      res.status(500).json({ error: 'Failed to create spot' });
    }
  }
);

 
// LIKES API

// Get likes count for a spot
app.get('/api/spots/:spotId/likes', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.spotId)) {
      return res.status(400).json({ error: 'Invalid spot ID' });
    }

    const count = await db.collection('likes').countDocuments({
      spot_id: new ObjectId(req.params.spotId)
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// Check if user liked a spot
app.get('/api/spots/:spotId/likes/check', validateSession, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.spotId)) {
      return res.status(400).json({ error: 'Invalid spot ID' });
    }

    const like = await db.collection('likes').findOne({
      spot_id: new ObjectId(req.params.spotId),
      user_id: req.user.googleId
    });

    res.json({ liked: !!like });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ error: 'Failed to check like status' });
  }
});

// Toggle like (like/unlike)
app.post('/api/spots/:spotId/likes',
  validateSession,
  likeLimiter,
  [
    param('spotId').isMongoId().withMessage('Invalid spot ID')
  ],
  validateAndSanitize,
  async (req, res) => {
    try {
      const spotId = new ObjectId(req.params.spotId);
      const userId = req.user.googleId;

      // Verify spot exists
      const spot = await db.collection('spots').findOne({ 
        _id: spotId, 
        visible: true 
      });
      if (!spot) {
        return res.status(404).json({ error: 'Spot not found' });
      }

      // Use transaction for atomic like/unlike
      const session = client.startSession();

      try {
        await session.withTransaction(async () => {
          const deleteResult = await db.collection('likes').deleteOne({
            spot_id: spotId,
            user_id: userId
          }, { session });

          if (deleteResult.deletedCount === 0) {
            await db.collection('likes').insertOne({
              spot_id: spotId,
              user_id: userId,
              created_at: new Date()
            }, { session });
          }
        });

        const liked = await db.collection('likes').findOne({
          spot_id: spotId,
          user_id: userId
        });

        const count = await db.collection('likes').countDocuments({ 
          spot_id: spotId 
        });

        res.json({ liked: !!liked, count });

      } finally {
        await session.endSession();
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ error: 'Failed to toggle like' });
    }
  }
);

// Get comments for a spot (with replies)
app.get('/api/spots/:spotId/comments', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.spotId)) {
      return res.status(400).json({ error: 'Invalid spot ID' });
    }

    const spotId = new ObjectId(req.params.spotId);

    // Get all visible comments for the spot
    const comments = await db.collection('comments')
      .find({ 
        spot_id: spotId, 
        isVisible: true 
      })
      .sort({ created_at: 1 })
      .toArray();

    // Organize into threaded structure
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment._id.toString(), comment);

      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id.toString());
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    res.json(rootComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add new comment
app.post('/api/spots/:spotId/comments',
  validateSession,
  commentLimiter,
  [
    param('spotId')
      .isMongoId()
      .withMessage('Invalid spot ID'),
    body('text')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be 1-1000 characters')
      .matches(/^[\s\S]*$/) // Allow most characters but will sanitize
      .withMessage('Comment contains invalid characters'),
    body('parentCommentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent comment ID')
  ],
  validateAndSanitize,
  async (req, res) => {
    try {
      const { text, parentCommentId } = req.body;
      const spotId = new ObjectId(req.params.spotId);

      // Aggressive XSS prevention for comments
      const sanitizedText = DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });

      // Check for spam/repeated content
      const recentComments = await db.collection('comments')
        .find({
          user_id: req.user.googleId,
          created_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
        })
        .toArray();

      if (recentComments.some(comment => comment.text === sanitizedText)) {
        return res.status(429).json({ error: 'Duplicate comment detected' });
      }

      // Verify spot exists and is visible
      const spot = await db.collection('spots').findOne({ 
        _id: spotId, 
        visible: true 
      });
      if (!spot) {
        return res.status(404).json({ error: 'Spot not found' });
      }

      // Verify parent comment if provided
      let parentCommentObjectId = null;
      if (parentCommentId) {
        parentCommentObjectId = new ObjectId(parentCommentId);
        const parentComment = await db.collection('comments').findOne({
          _id: parentCommentObjectId,
          spot_id: spotId,
          isVisible: true
        });

        if (!parentComment) {
          return res.status(404).json({ error: 'Parent comment not found' });
        }

        // Prevent deep nesting (max 3 levels)
        let depth = 1;
        let currentParent = parentComment;
        while (currentParent.parent_comment_id && depth < 3) {
          currentParent = await db.collection('comments').findOne({
            _id: currentParent.parent_comment_id
          });
          depth++;
        }

        if (depth >= 3) {
          return res.status(400).json({ error: 'Maximum reply depth exceeded' });
        }
      }

      const newComment = {
        spot_id: spotId,
        user_id: req.user.googleId,
        text: sanitizedText,
        created_at: new Date(),
        isVisible: true,
        parent_comment_id: parentCommentObjectId
      };

      const cleanedComment = sanitizeMongoQuery(newComment);

      const result = await db.collection('comments').insertOne(cleanedComment);

      res.status(201).json({
        ...newComment,
        _id: result.insertedId,
        replies: []
      });

    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

// Delete/hide comment (no admin role rn thougj)
app.delete('/api/comments/:commentId', validateSession, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const commentId = new ObjectId(req.params.commentId);
    const comment = await db.collection('comments').findOne({ _id: commentId });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only allow creator to delete their own comments
    if (comment.user_id !== req.user.googleId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Mark as invisible instead of deleting (preserves reply structure)
    await db.collection('comments').updateOne(
      { _id: commentId },
      { 
        $set: { 
          isVisible: false, 
          text: '[deleted]',
          deleted_at: new Date() 
        } 
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});


// HELPERS

async function createIndexes() {
  // User collection
  await db.collection('users').createIndex({ googleId: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 });
  
  // Likes collection 
  await db.collection('likes').createIndex({ spot_id: 1, user_id: 1 }, { unique: true }); // Prevent duplicate likes
  await db.collection('likes').createIndex({ spot_id: 1 }); // Query likes for a spot
  await db.collection('likes').createIndex({ user_id: 1 }); // Query user's likes

  // Comments collection 
  await db.collection('comments').createIndex({ spot_id: 1, created_at: -1 }); // Spot comments by time
  await db.collection('comments').createIndex({ parent_comment_id: 1 }); // Find replies
  await db.collection('comments').createIndex({ user_id: 1 });
  await db.collection('comments').createIndex({ isVisible: 1 });

  // Spot collection
  await db.collection('spots').createIndex({ coordinates: '2dsphere' }); // Geospatial
  await db.collection('spots').createIndex({ name: 'text' }); // Text search
  await db.collection('spots').createIndex({ creator_id: 1 });
  await db.collection('spots').createIndex({ visible: 1 });
}

function validateAndSanitize(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

function sanitizeMongoQuery(obj) {
  if (obj && typeof obj === 'object') {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove MongoDB operators from strings
        obj[key] = obj[key].replace(/^\$/, '');
      } else if (typeof obj[key] === 'object') {
        sanitizeMongoQuery(obj[key]);
      }
    }
  }
  return obj;
}



