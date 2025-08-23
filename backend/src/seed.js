/*const { MongoClient } = require('mongodb');

const url = "mongodb+srv://first_user:gFvZYqlcFELMKVit@coolspot.q2prwro.mongodb.net/?retryWrites=true&w=majority&appName=coolspot";
const client = new MongoClient(url);
const dbName = 'spotDB';
const spotsToSeed = [
    {name: 'UCR Bell Tower', coordinates: [-117.3281, 33.9737], type: 'landmark' creator_id: '101601911318304770717', created_on: 2025-08-23T18:58:45.547+00:00}, visible: true}
    {name: 'UCR Botanic Gardens', coordinates: [-117.3195, 33.9680], type: 'recreation' },
    {name: 'UCR Soccer Stadium', coordinates: [-117.3350, 33.9780], type: 'sports' },
    {name: 'Sweeney Art Gallery', coordinates: [-117.3290, 33.9745], type: 'culture' },
    {name: 'UCR California Museum of Photography', coordinates: [-117.3285, 33.9748], type: 'culture' },
    {name: 'Barbara and Art Culver Center', coordinates: [-117.3288, 33.9746], type: 'culture' },
    {name: 'Stonehaven Apartments', coordinates: [-117.3400, 33.9800], type: 'housing' },
    {name: 'Falkirk Apartments', coordinates: [-117.3410, 33.9810], type: 'housing' },
    {name: 'Canyon Crest', coordinates: [-117.3150, 33.9650], type: 'housing' },
    { name: 'Nevermore Game Club', coordinates: [-117.3320, 33.9720], type: 'entertainment' },
    { name: 'Riverside Game Lab', coordinates: [-117.3300, 33.9710], type: 'entertainment' },
    { name: 'Farm House Collective', coordinates: [-117.3250, 33.9690], type: 'dining' },
    { name: 'Downtown Farmer\'s Market', coordinates: [-117.3700, 33.9800], type: 'shopping' },
    { name: 'Towngate Promenade', coordinates: [-117.2800, 33.9900], type: 'shopping' },
    { name: 'UCR Student Recreation Center', coordinates: [-117.3260, 33.9730], type: 'recreation' },
    { name: 'UCR Library', coordinates: [-117.3270, 33.9740], type: 'academic' },
    { name: 'Riverside Archery', coordinates: [-117.3400, 33.9650], type: 'recreation' },
    { name: 'Urban Dripp Coffee', coordinates: [-117.3200, 33.9720], type: 'dining' },
    { name: 'UCR Student Union', coordinates: [-117.3275, 33.9735], type: 'academic' },
    { name: 'Worlds Largest Paper Cup', coordinates: [-117.3180, 33.9700], type: 'landmark' }
]; */

/* const usersToSeed = [
    { userid: 1, username: 'highlander_student', liked_spots: [1, 5, 12], visited_spots: [1, 2, 5, 12, 16], cookie: 'placeholder_cookie_1', password_hash: '$2b$12$placeholder_hash_1' },
    { userid: 2, username: 'botanic_wanderer', liked_spots: [2, 17, 20], visited_spots: [2, 8, 17, 18, 20], cookie: 'placeholder_cookie_2', password_hash: '$2b$12$placeholder_hash_2' },
    { userid: 3, username: 'soccer_fanatic', liked_spots: [3, 15], visited_spots: [3, 7, 15, 19], cookie: 'placeholder_cookie_3', password_hash: '$2b$12$placeholder_hash_3' },
    { userid: 4, username: 'art_enthusiast', liked_spots: [4, 5, 6], visited_spots: [4, 5, 6, 11, 16], cookie: 'placeholder_cookie_4', password_hash: '$2b$12$placeholder_hash_4' },
    { userid: 5, username: 'canyon_dweller', liked_spots: [9, 18], visited_spots: [9, 12, 18], cookie: 'placeholder_cookie_5', password_hash: '$2b$12$placeholder_hash_5' },
    { userid: 6, username: 'gamer_hub', liked_spots: [10, 11], visited_spots: [10, 11, 14], cookie: 'placeholder_cookie_6', password_hash: '$2b$12$placeholder_hash_6' },
    { userid: 7, username: 'coffee_crawler', liked_spots: [12, 18], visited_spots: [12, 13, 18, 19], cookie: 'placeholder_cookie_7', password_hash: '$2b$12$placeholder_hash_7' },
    { userid: 8, username: 'stonehaven_resident', liked_spots: [7, 15, 19], visited_spots: [1, 7, 15, 16, 19], cookie: 'placeholder_cookie_8', password_hash: '$2b$12$placeholder_hash_8' },
    { userid: 9, username: 'market_browser', liked_spots: [13, 14], visited_spots: [13, 14], cookie: 'placeholder_cookie_9', password_hash: '$2b$12$placeholder_hash_9' },
    { userid: 10, username: 'rec_center_regular', liked_spots: [15], visited_spots: [3, 15, 17], cookie: 'placeholder_cookie_10', password_hash: '$2b$12$placeholder_hash_10' },
    { userid: 11, username: 'library_scholar', liked_spots: [16], visited_spots: [16], cookie: 'placeholder_cookie_11', password_hash: '$2b$12$placeholder_hash_11' },
    { userid: 12, username: 'archery_archer', liked_spots: [17], visited_spots: [2, 17], cookie: 'placeholder_cookie_12', password_hash: '$2b$12$placeholder_hash_12' },
    { userid: 13, username: 'falkirk_explorer', liked_spots: [8, 14, 20], visited_spots: [8, 14, 20], cookie: 'placeholder_cookie_13', password_hash: '$2b$12$placeholder_hash_13' },
    { userid: 14, username: 'campus_photographer', liked_spots: [1, 2, 5, 6], visited_spots: [1, 2, 4, 5, 6, 20], cookie: 'placeholder_cookie_14', password_hash: '$2b$12$placeholder_hash_14' },
    { userid: 15, username: 'foodie_finder', liked_spots: [12, 18], visited_spots: [12, 13, 18], cookie: 'placeholder_cookie_15', password_hash: '$2b$12$placeholder_hash_15' },
    { userid: 16, username: 'shopping_scout', liked_spots: [13, 14], visited_spots: [13, 14], cookie: 'placeholder_cookie_16', password_hash: '$2b$12$placeholder_hash_16' },
    { userid: 17, username: 'wellness_walker', liked_spots: [2, 15, 17], visited_spots: [2, 15, 17], cookie: 'placeholder_cookie_17', password_hash: '$2b$12$placeholder_hash_17' },
    { userid: 18, username: 'culture_collector', liked_spots: [4, 5, 6, 11], visited_spots: [4, 5, 6, 11], cookie: 'placeholder_cookie_18', password_hash: '$2b$12$placeholder_hash_18' },
    { userid: 19, username: 'landmark_hunter', liked_spots: [1, 20], visited_spots: [1, 20], cookie: 'placeholder_cookie_19', password_hash: '$2b$12$placeholder_hash_19' },
    { userid: 20, username: 'social_connector', liked_spots: [10, 11, 13, 19], visited_spots: [10, 11, 13, 19], cookie: 'placeholder_cookie_20', password_hash: '$2b$12$placeholder_hash_20' }
]; */

// Add to your backend code - create a new file: seed-database.js

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: './back.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = 'spotDB';

// Test user data (fake Google IDs)
const testUsers = [
  {
    googleId: '100000000000000000001',
    email: 'alice@test.com',
    name: 'Alice Johnson',
    picture: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=AJ',
    lastLogin: new Date()
  },
  {
    googleId: '100000000000000000002', 
    email: 'bob@test.com',
    name: 'Bob Smith',
    picture: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=BS',
    lastLogin: new Date()
  },
  {
    googleId: '100000000000000000003',
    email: 'charlie@test.com', 
    name: 'Charlie Brown',
    picture: 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=CB',
    lastLogin: new Date()
  },
  {
    googleId: '100000000000000000004',
    email: 'diana@test.com',
    name: 'Diana Prince', 
    picture: 'https://via.placeholder.com/150/96CEB4/FFFFFF?text=DP',
    lastLogin: new Date()
  }
];

// Sample spots data - varied locations and types
const sampleSpots = [
  {
    name: 'UCR Bell Tower',
    coordinates: [-117.3281, 33.9737],
    type: 'landmark',
    creator_id: '100000000000000000001',
    created_on: new Date('2025-08-20T10:30:00Z'),
    visible: true
  },
  {
    name: 'Starbucks Coffee',
    coordinates: [-117.3285, 33.9742],
    type: 'cafe',
    creator_id: '100000000000000000002', 
    created_on: new Date('2025-08-21T14:15:00Z'),
    visible: true
  },
  {
    name: 'Riverside Park',
    coordinates: [-117.3275, 33.9730],
    type: 'park',
    creator_id: '100000000000000000001',
    created_on: new Date('2025-08-22T09:45:00Z'),
    visible: true
  },
  {
    name: 'Hidden Study Spot',
    coordinates: [-117.3290, 33.9735],
    type: 'study',
    creator_id: '100000000000000000003',
    created_on: new Date('2025-08-22T16:20:00Z'), 
    visible: true
  },
  {
    name: 'Food Truck Corner',
    coordinates: [-117.3278, 33.9745],
    type: 'food',
    creator_id: '100000000000000000004',
    created_on: new Date('2025-08-23T12:00:00Z'),
    visible: true
  },
  {
    name: 'Private Location',
    coordinates: [-117.3295, 33.9740],
    type: 'private',
    creator_id: '100000000000000000002',
    created_on: new Date('2025-08-23T18:00:00Z'),
    visible: false // Test invisible spots
  }
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB for seeding...');

    const db = client.db(dbName);

    // Clear existing data (WARNING: This deletes everything!)
    console.log('Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('spots').deleteMany({});
    await db.collection('likes').deleteMany({});
    await db.collection('comments').deleteMany({});

    // Insert test users
    console.log('Seeding users...');
    await db.collection('users').insertMany(testUsers);

    // Insert spots
    console.log('Seeding spots...');
    const spotResult = await db.collection('spots').insertMany(sampleSpots);
    const spotIds = Object.values(spotResult.insertedIds);

    // Generate likes (varied distribution)
    console.log('Seeding likes...');
    const likes = [];

    // Bell Tower - popular (3 likes)
    likes.push(
      { spot_id: spotIds[0], user_id: '100000000000000000002', created_at: new Date('2025-08-20T11:00:00Z') },
      { spot_id: spotIds[0], user_id: '100000000000000000003', created_at: new Date('2025-08-20T15:30:00Z') },
      { spot_id: spotIds[0], user_id: '100000000000000000004', created_at: new Date('2025-08-21T08:45:00Z') }
    );

    // Starbucks - moderate (2 likes)  
    likes.push(
      { spot_id: spotIds[1], user_id: '100000000000000000001', created_at: new Date('2025-08-21T14:30:00Z') },
      { spot_id: spotIds[1], user_id: '100000000000000000003', created_at: new Date('2025-08-22T10:15:00Z') }
    );

    // Park - single like
    likes.push(
      { spot_id: spotIds[2], user_id: '100000000000000000004', created_at: new Date('2025-08-22T11:00:00Z') }
    );

    // Food Truck - popular (4 likes)
    likes.push(
      { spot_id: spotIds[4], user_id: '100000000000000000001', created_at: new Date('2025-08-23T12:30:00Z') },
      { spot_id: spotIds[4], user_id: '100000000000000000002', created_at: new Date('2025-08-23T13:15:00Z') },
      { spot_id: spotIds[4], user_id: '100000000000000000003', created_at: new Date('2025-08-23T14:00:00Z') },
      { spot_id: spotIds[4], user_id: '100000000000000000004', created_at: new Date('2025-08-23T15:30:00Z') }
    );

    await db.collection('likes').insertMany(likes);

    // Generate comments with threading
    console.log('Seeding comments...');
    const comments = [];

    // Bell Tower comments (with replies)
    const bellTowerComment1 = {
      _id: new ObjectId(),
      spot_id: spotIds[0],
      user_id: '100000000000000000002',
      text: 'Beautiful landmark! Great for photos.',
      created_at: new Date('2025-08-20T11:30:00Z'),
      isVisible: true,
      parent_comment_id: null
    };
    comments.push(bellTowerComment1);

    // Reply to bell tower comment
    comments.push({
      spot_id: spotIds[0],
      user_id: '100000000000000000003', 
      text: 'Agreed! The sunset views are amazing.',
      created_at: new Date('2025-08-20T16:00:00Z'),
      isVisible: true,
      parent_comment_id: bellTowerComment1._id
    });

    // Another top-level comment on bell tower
    comments.push({
      spot_id: spotIds[0],
      user_id: '100000000000000000001',
      text: 'Iconic UCR spot. Been here since the 1960s!',
      created_at: new Date('2025-08-21T09:15:00Z'),
      isVisible: true,
      parent_comment_id: null
    });

    // Starbucks comments
    const starbucksComment1 = {
      _id: new ObjectId(),
      spot_id: spotIds[1],
      user_id: '100000000000000000001',
      text: 'WiFi is fast, good for studying. Gets crowded around finals.',
      created_at: new Date('2025-08-21T14:45:00Z'),
      isVisible: true,
      parent_comment_id: null
    };
    comments.push(starbucksComment1);

    // Nested reply thread
    const starbucksReply1 = {
      _id: new ObjectId(),
      spot_id: spotIds[1],
      user_id: '100000000000000000003',
      text: 'What are the best hours to find seating?',
      created_at: new Date('2025-08-22T10:30:00Z'),
      isVisible: true,
      parent_comment_id: starbucksComment1._id
    };
    comments.push(starbucksReply1);

    // Reply to the reply
    comments.push({
      spot_id: spotIds[1],
      user_id: '100000000000000000001',
      text: 'Early morning (7-9am) or late afternoon (3-5pm) usually work best.',
      created_at: new Date('2025-08-22T11:00:00Z'),
      isVisible: true,
      parent_comment_id: starbucksReply1._id
    });

    // Food truck comments
    comments.push({
      spot_id: spotIds[4],
      user_id: '100000000000000000002',
      text: 'Best tacos on campus! Usually here Tue-Fri.',
      created_at: new Date('2025-08-23T12:45:00Z'),
      isVisible: true,
      parent_comment_id: null
    });

    // Deleted comment example
    comments.push({
      spot_id: spotIds[4],
      user_id: '100000000000000000004',
      text: '[deleted]',
      created_at: new Date('2025-08-23T13:30:00Z'),
      isVisible: false,
      parent_comment_id: null,
      deleted_at: new Date('2025-08-23T14:00:00Z')
    });

    // Study spot comment (no replies)
    comments.push({
      spot_id: spotIds[3],
      user_id: '100000000000000000003',
      text: 'Shh... keep this one quiet! Perfect for concentration.',
      created_at: new Date('2025-08-22T16:45:00Z'),
      isVisible: true,
      parent_comment_id: null
    });

    await db.collection('comments').insertMany(comments);

    // Create indexes
    console.log('Creating indexes...');
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true });
    await db.collection('spots').createIndex({ coordinates: '2dsphere' });
    await db.collection('spots').createIndex({ name: 'text' });
    await db.collection('likes').createIndex({ spot_id: 1, user_id: 1 }, { unique: true });
    await db.collection('comments').createIndex({ spot_id: 1, created_at: -1 });
    await db.collection('comments').createIndex({ parent_comment_id: 1 });

    console.log('Database seeding completed successfully!');
    console.log(`Created: ${testUsers.length} users, ${sampleSpots.length} spots, ${likes.length} likes, ${comments.length} comments`);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await client.close();
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };



async function runSeed() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('users');

    await collection.deleteMany({});
    await collection.insertMany(usersToSeed);
    console.log("Successfully seeded the spot collection.");

  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  }
}

runSeed().catch(console.dir);
