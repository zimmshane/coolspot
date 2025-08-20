const { Spot, SpotLike, User } = require('../models');

const getNearbySpots = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, category } = req.query;
    const coordinates = [parseFloat(lng), parseFloat(lat)];

    const filters = category ? { category } : {};
    const spots = await Spot.findNearby(coordinates, parseInt(radius), filters);

    // Populate like counts
    const spotsWithLikes = await Spot.populate(spots, {
      path: 'likeCount'
    });

    res.json(spotsWithLikes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNearbySpots };
