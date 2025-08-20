const mongoose = require('mongoose');
const { coordinateValidator } = require('./shared/validators');
const { geospatialMiddleware } = require('./shared/middleware');

const spotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: coordinateValidator
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['restaurant', 'viewpoint', 'park', 'beach', 'shopping', 'nightlife', 'culture', 'adventure', 'hidden']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    images: [{
      url: String,
      caption: String,
      uploadedAt: { type: Date, default: Date.now },
      isMain: { type: Boolean, default: false }
    }]
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'flagged'],
      default: 'pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    reportCount: { type: Number, default: 0 }
  },
  engagement: {
    visits: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    }
  },
  metadata: {
    tags: [String],
    accessibility: {
      wheelchairAccessible: Boolean,
      publicTransport: Boolean,
      parkingAvailable: Boolean
    }
  },
  visibility: {
    isPublic: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Critical geospatial index
spotSchema.index({ location: '2dsphere' });
spotSchema.index({ 
  'visibility.isPublic': 1, 
  'verification.status': 1, 
  category: 1,
  location: '2dsphere' 
});
spotSchema.index({ creator: 1, createdAt: -1 });

// Text search index
spotSchema.index({
  name: 'text',
  description: 'text',
  'metadata.tags': 'text'
});

// Pre-save middleware for duplicate detection
spotSchema.pre('save', geospatialMiddleware);

// Static methods for geospatial queries
spotSchema.statics.findNearby = function(coordinates, radius = 5000, filters = {}) {
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radius
      }
    },
    'visibility.isPublic': true,
    'verification.status': { $in: ['verified', 'pending'] },
    ...filters
  };

  return this.find(query).populate('creator', 'username profile.displayName');
};

// Virtual for like count (requires separate SpotLike model)
spotSchema.virtual('likeCount', {
  ref: 'SpotLike',
  localField: '_id',
  foreignField: 'spotId',
  count: true
});

module.exports = mongoose.model('Spot', spotSchema);
