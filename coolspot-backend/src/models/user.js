const mongoose = require('mongoose');
const { emailValidator, usernameValidator } = require('./shared/validators');
const { auditMiddleware } = require('./shared/middleware');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: emailValidator
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    validate: usernameValidator
  },
  profile: {
    displayName: {
      type: String,
      maxlength: 50,
      default: function() { return this.username; }
    },
    avatar: String,
    bio: { type: String, maxlength: 500 },
    joinDate: { type: Date, default: Date.now }
  },
  preferences: {
    discoveryRadius: {
      type: Number,
      default: 5000,
      min: 100,
      max: 50000
    },
    categories: [{
      type: String,
      enum: ['restaurant', 'viewpoint', 'park', 'beach', 'shopping', 'nightlife', 'culture', 'adventure', 'hidden']
    }]
  },
  stats: {
    spotsCreated: { type: Number, default: 0 },
    spotsVisited: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 }
  },
  moderation: {
    reputationScore: { type: Number, default: 100 },
    reportCount: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    bannedUntil: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ username: 1, email: 1 });
userSchema.index({ 'moderation.reputationScore': -1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// Virtual for full name
userSchema.virtual('displayName').get(function() {
  return this.profile.displayName || this.username;
});

// Pre-save middleware
userSchema.pre('save', auditMiddleware);

// Instance methods
userSchema.methods.updateStats = async function() {
  const Spot = mongoose.model('Spot');
  const SpotLike = mongoose.model('SpotLike');

  const spotsCreated = await Spot.countDocuments({ creator: this._id });
  const totalLikes = await SpotLike.countDocuments({ 
    spotId: { $in: await Spot.distinct('_id', { creator: this._id }) }
  });

  this.stats.spotsCreated = spotsCreated;
  this.stats.totalLikes = totalLikes;

  return this.save();
};

// Static methods
userSchema.statics.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { username: identifier },
      { email: identifier.toLowerCase() }
    ]
  });
};

module.exports = mongoose.model('User', userSchema);
