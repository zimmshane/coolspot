const { MongoClient } = require('mongodb');

const url = "mongodb+srv://first_user:gFvZYqlcFELMKVit@coolspot.q2prwro.mongodb.net/?retryWrites=true&w=majority&appName=coolspot";
const client = new MongoClient(url);
const dbName = 'spotDB';

/* const spotsToSeed = [
    { id: 1, name: 'UCR Bell Tower', coordinates: [-117.3281, 33.9737], type: 'landmark' },
    { id: 2, name: 'UCR Botanic Gardens', coordinates: [-117.3195, 33.9680], type: 'recreation' },
    { id: 3, name: 'UCR Soccer Stadium', coordinates: [-117.3350, 33.9780], type: 'sports' },
    { id: 4, name: 'Sweeney Art Gallery', coordinates: [-117.3290, 33.9745], type: 'culture' },
    { id: 5, name: 'UCR California Museum of Photography', coordinates: [-117.3285, 33.9748], type: 'culture' },
    { id: 6, name: 'Barbara and Art Culver Center', coordinates: [-117.3288, 33.9746], type: 'culture' },
    { id: 7, name: 'Stonehaven Apartments', coordinates: [-117.3400, 33.9800], type: 'housing' },
    { id: 8, name: 'Falkirk Apartments', coordinates: [-117.3410, 33.9810], type: 'housing' },
    { id: 9, name: 'Canyon Crest', coordinates: [-117.3150, 33.9650], type: 'housing' },
    { id: 10, name: 'Nevermore Game Club', coordinates: [-117.3320, 33.9720], type: 'entertainment' },
    { id: 11, name: 'Riverside Game Lab', coordinates: [-117.3300, 33.9710], type: 'entertainment' },
    { id: 12, name: 'Farm House Collective', coordinates: [-117.3250, 33.9690], type: 'dining' },
    { id: 13, name: 'Downtown Farmer\'s Market', coordinates: [-117.3700, 33.9800], type: 'shopping' },
    { id: 14, name: 'Towngate Promenade', coordinates: [-117.2800, 33.9900], type: 'shopping' },
    { id: 15, name: 'UCR Student Recreation Center', coordinates: [-117.3260, 33.9730], type: 'recreation' },
    { id: 16, name: 'UCR Library', coordinates: [-117.3270, 33.9740], type: 'academic' },
    { id: 17, name: 'Riverside Archery', coordinates: [-117.3400, 33.9650], type: 'recreation' },
    { id: 18, name: 'Urban Dripp Coffee', coordinates: [-117.3200, 33.9720], type: 'dining' },
    { id: 19, name: 'UCR Student Union', coordinates: [-117.3275, 33.9735], type: 'academic' },
    { id: 20, name: 'Worlds Largest Paper Cup', coordinates: [-117.3180, 33.9700], type: 'landmark' }
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
