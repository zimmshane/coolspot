const emailValidator = {
  validator: function(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  message: 'Invalid email format'
};

const usernameValidator = {
  validator: function(username) {
    return /^[a-zA-Z0-9_]+$/.test(username);
  },
  message: 'Username can only contain letters, numbers, and underscores'
};

const coordinateValidator = {
  validator: function(coords) {
    return coords.length === 2 &&
           coords[0] >= -180 && coords[0] <= 180 &&
           coords[1] >= -90 && coords[1] <= 90;
  },
  message: 'Invalid coordinates format'
};

module.exports = {
  emailValidator,
  usernameValidator,
  coordinateValidator
};
