const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    propertyType: {
      type: String,
      enum: ["Apartment", "Villa", "Independent House", "Plot", "Commercial", "Studio"],
      default: "Apartment",
    },
    listingType: { type: String, enum: ["Sale", "Rent"], default: "Sale" },
    price: { type: Number, required: true },
    priceUnit: { type: String, default: "INR" },
    areaSqft: { type: Number, required: true },
    bhk: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    furnishing: { type: String, enum: ["Unfurnished", "Semi-Furnished", "Furnished"], default: "Unfurnished" },
    floor: { type: Number, default: 0 },
    totalFloors: { type: Number, default: 1 },
    ageOfProperty: { type: Number, default: 0 },
    facing: { type: String, default: "North" },
    amenities: [{ type: String }],
    images: [{ type: String }],
    city: { type: String, required: true, index: true },
    locality: { type: String, required: true, index: true },
    address: { type: String, default: "" },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    areaIntelligence: { 
      walkScore: { type: Number, default: 0 },
      safetyScore: { type: Number, default: 0 },
      connectivityScore: { type: Number, default: 0 },
      nearbySchools: { type: Number, default: 0 },
      nearbyHospitals: { type: Number, default: 0 },
      priceGrowth5yr: { type: Number, default: 0 },
    },
    predictedPrice: { type: Number, default: null },
    forecastedPrice1yr: { type: Number, default: null },
    forecastedPrice3yr: { type: Number, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    contactPhone: { type: String, default: "" },
    source: { type: String, enum: ["Admin", "Owner"], default: "Admin" },
    status: { type: String, enum: ["Pending", "Active", "Sold", "Rented", "Inactive", "Rejected"], default: "Active" },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

propertySchema.index({ title: "text", city: "text", locality: "text" });

module.exports = mongoose.model("Property", propertySchema);
