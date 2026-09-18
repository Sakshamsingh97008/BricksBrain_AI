const User = require("../models/User");
const Property = require("../models/Property");

exports.getPendingProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ status: "Pending" }).sort({ createdAt: -1 }).populate("owner", "name email phone");
    res.json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProperties, activeListings, totalViews] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({ status: "Active" }),
      Property.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    ]);

    const propertiesByType = await Property.aggregate([
      { $group: { _id: "$propertyType", count: { $sum: 1 } } },
    ]);

    const propertiesByCity = await Property.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("name email createdAt role");
    const recentProperties = await Property.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        activeListings,
        totalViews: totalViews[0]?.total || 0,
      },
      propertiesByType,
      propertiesByCity,
      recentUsers,
      recentProperties,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};
