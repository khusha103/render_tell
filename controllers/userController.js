const User = require('../models/User');

exports.getProfile = async (req, res) => {
  const user = await User.findByPk(req.userId);
  res.json(user);
};