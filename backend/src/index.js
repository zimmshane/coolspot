const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb'); // Import the MongoClient


const MONGODB_URI = ""

const app = express();
const port = 3001;

const client = new MongoClient(MONGODB_URI);
const dbName = 'spotsDB';

app.use(cors());
app.use(cookieParser());

async function connectToDb() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    db = client.db(dbName); // Assign the database connection to our variable
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit if we can't connect
  }
}


let db = connectToDb();

app.get('/', (req, res) => {
    let visitCount = parseInt(req.cookies.visitCount) || 0;
    visitCount++;

    // Set the cookie in the user's browser
    res.cookie('visitCount', visitCount.toString(), { maxAge: 900000, httpOnly: true });

    res.send(`Welcome! You have visited this page ${visitCount} times.`);
});

app.get('/search', async (req, res) => {
    const nameQuery = req.query.name;
    if (!nameQuery) {
        return res.status(400).send('A name query parameter is required.');
    }
    try {
        const results = await db.collection('spots').find({
            name: { $regex: nameQuery, $options: 'i' }
        }).toArray();
        res.json(results);
    } catch (err) {
        res.status(500).send('Error during search');
    }
});

app.get('/spots/filter', async (req, res) => {
    const { genre, publishedAfter } = req.query;
    let filter = {};

    // Build the filter object dynamically based on query parameters
    if (genre) {
        filter.genre = genre;
    }
    if (publishedAfter) {
        // Use $gt for "greater than"
        filter.year = { $gt: parseInt(publishedAfter) };
    }

    try {
        const results = await db.collection('books').find(filter).toArray();
        res.json(results);
    } catch (err) {
        res.status(500).send('Error applying filters');
    }
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});


