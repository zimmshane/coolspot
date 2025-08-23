const path = require('path');

// Load .env from project root (2 levels up from src/index.js)
require('dotenv').config({ 
  path: path.join(__dirname, '../back.env') 
});

//Load other dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');
const { OAuth2Client } = require('google-auth-library');


// rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many auth attempts' }
});

// Validate required environment variables
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

const app = express();
const port = 3001;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

const client = new MongoClient(MONGODB_URI);
const dbName = 'spotDB';
let db;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

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
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 });
    console.log('Database indexes created');

  } catch (err) {
    console.error('MongoDB connection error details:');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  }
}

// Ensure database connection before starting server
connectToDb().then(() => {
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
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

      // Store/update user - fix the database access
      const user = await db.collection('users').findOneAndUpdate(
        { googleId },
        { 
          $set: { email, name, picture, lastLogin: new Date() }
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


  // Session validation middleware
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

