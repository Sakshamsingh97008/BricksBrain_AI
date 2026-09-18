const express = require("express");
const router = express.Router();
const { getDashboardStats, getAllUsers, updateUserRole, deleteUser, getPendingProperties } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);
router.get("/stats", getDashboardStats);
router.get("/pending-properties", getPendingProperties);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
