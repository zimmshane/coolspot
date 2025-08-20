const auditMiddleware = function(next) {
  // Add audit trail for user changes
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
};

const geospatialMiddleware = async function(next) {
  if (this.isNew && this.location) {
    // Check for nearby duplicates
    const nearby = await this.constructor.find({
      location: {
        $near: {
          $geometry: this.location,
          $maxDistance: 10 // 10 meters
        }
      },
      name: new RegExp(this.name, 'i')
    });

    if (nearby.length > 0) {
      return next(new Error('Similar spot already exists nearby'));
    }
  }
  next();
};

module.exports = {
  auditMiddleware,
  geospatialMiddleware
};
