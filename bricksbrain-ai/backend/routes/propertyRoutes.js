const express = require("express");
const router = express.Router();
const {
  getProperties, getFeatured, getPropertyById, createProperty, listProperty, getMyListings,
  updateProperty, deleteProperty, toggleSaveProperty, compareProperties, getRecommendations,
  predictPrice, forecastPrice, calculateEMI, interiorDesign,
} = require("../controllers/propertyController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/featured", getFeatured);
router.get("/my-listings", protect, getMyListings);
router.get("/recommendations", protect, getRecommendations);
router.post("/predict-price", predictPrice);
router.post("/forecast", forecastPrice);
router.post("/emi", calculateEMI);
router.post("/interior-design", protect, interiorDesign);
router.post("/compare", compareProperties);

// "Post Your Property" -- any logged-in user, with photo upload
router.post("/list", protect, upload.array("images", 8), listProperty);

router.get("/", getProperties);
router.post("/", protect, adminOnly, createProperty);
router.get("/:id", getPropertyById);
router.put("/:id", protect, updateProperty);
router.delete("/:id", protect, deleteProperty);
router.post("/:id/save", protect, toggleSaveProperty);

module.exports = router;
