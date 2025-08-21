const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb'); // Import the MongoClient


const MONGODB_URI = "NONE"
const User = require('./user');
const Spot = require('./spot');
const SpotLike = require('./spotLike');
const SpotVisit = require('./SpotVisit');
const Comment = require('./Comment');

const app = express();
const port = 3001;

const client = new MongoClient(MONGODB_URI);
const dbName = 'spotsDB';

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



