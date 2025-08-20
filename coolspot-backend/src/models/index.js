

const MONGODB_URI = 
const Spot = require('./spot');
const SpotLike = require('./spotLike');
const SpotVisit = require('./SpotVisit');
const Comment = require('./Comment');

// Create indexes on application startup
const createIndexes = async () => {
  try {
    await Promise.all([
      User.createIndexes(),
      Spot.createIndexes(),
      SpotLike.createIndexes(),
      SpotVisit.createIndexes(),
      Comment.createIndexes()
    ]);
    console.log('All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = {
  User,
  Spot,
  SpotLike,
  SpotVisit,
  Comment,
  createIndexes
};
