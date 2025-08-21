const { MongoClient } = require('mongodb');

const url = ;
const client = new MongoClient(url);
const dbName = 'spotDB';

const spotsToSeed = [
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
];


async function runSeed() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('spots');

    await collection.deleteMany({});
    await collection.insertMany(spotsToSeed);
    console.log("Successfully seeded the spot collection.");

  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  }
}

runSeed().catch(console.dir);
