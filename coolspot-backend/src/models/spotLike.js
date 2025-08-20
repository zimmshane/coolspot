const mongoose = require('mongoose');

const spotLikeSchema = new mongoose.Schema({
  spotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Spot',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate likes
spotLikeSchema.index({ spotId: 1, userId: 1 }, { unique: true });
spotLikeSchema.index({ userId: 1, likedAt: -1 }); // User's like history
spotLikeSchema.index({ spotId: 1, likedAt: -1 }); // Spot's likes chronologically

// Static method for toggling likes
spotLikeSchema.statics.toggleLike = async function(spotId, userId) {
  const existingLike = await this.findOne({ spotId, userId });

  if (existingLike) {
    await this.deleteOne({ _id: existingLike._id });
    return { action: 'unliked', liked: false };
  } else {
    await this.create({ spotId, userId });
    return { action: 'liked', liked: true };
  }
};

module.exports = mongoose.model('SpotLike', spotLikeSchema);
