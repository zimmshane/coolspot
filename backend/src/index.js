const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { OAuth2Client } = require('google-auth-library');

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const app = express();
const port = 3001;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

const client = new MongoClient(MONGODB_URI);
const dbName = 'spotsDB';
let db;

app.use(cors({
  origin: 'http://localhost:3000', // Your React app URL
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

async function connectToDb() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    db = client.db(dbName);
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);         
    process.exit(1);
  }
}

// Google OAuth verification endpoint
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Store or update user in database
    const user = await db.collection('users').findOneAndUpdate(
      { googleId },
      { 
        $set: { email, name, picture, lastLogin: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Create session or JWT token here
    res.cookie('userId', user.value._id.toString(), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ user: user.value, success: true });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Your existing routes...
connectToDb().then(() => {
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
});
