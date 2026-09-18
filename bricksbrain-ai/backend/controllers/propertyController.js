const Property = require("../models/Property");
const User = require("../models/User");
const axios = require("axios");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// GET /api/properties  (search + filters + pagination)
exports.getProperties = async (req, res, next) => {
  try {
    const {
      city, locality, propertyType, listingType, minPrice, maxPrice,
      bhk, minArea, maxArea, furnishing, sort, page = 1, limit = 12, q,
    } = req.query;

    const filter = { status: "Active" };
    if (city) filter.city = new RegExp(city, "i");
    if (locality) filter.locality = new RegExp(locality, "i");
    if (propertyType) filter.propertyType = propertyType;
    if (listingType) filter.listingType = listingType;
    if (furnishing) filter.furnishing = furnishing;
    if (bhk) filter.bhk = { $in: bhk.split(",").map(Number) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minArea || maxArea) {
      filter.areaSqft = {};
      if (minArea) filter.areaSqft.$gte = Number(minArea);
      if (maxArea) filter.areaSqft.$lte = Number(maxArea);
    }
    if (q) filter.$text = { $search: q };

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "area_desc") sortOption = { areaSqft: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sortOption).skip(skip).limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: properties.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      properties,
    });
  } catch (err) {
    next(err);
  }
};

exports.getFeatured = async (req, res, next) => {
  try {
    const properties = await Property.find({ status: "Active", isFeatured: true }).limit(8);
    res.json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

exports.getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });
    property.views += 1;
    await property.save();
    res.json({ success: true, property });
  } catch (err) {
    next(err);
  }
};

exports.createProperty = async (req, res, next) => {
  try {
    const property = await Property.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, property });
  } catch (err) {
    next(err);
  }
};

// POST /api/properties/list  (any logged-in user — "Post Your Property" flow, with photo upload)
exports.listProperty = async (req, res, next) => {
  try {
    const {
      title, description, propertyType, listingType, price, areaSqft, bhk, bathrooms,
      furnishing, floor, totalFloors, ageOfProperty, facing, amenities, city, locality,
      address, contactPhone, lat, lng,
    } = req.body;

    if (!title || !price || !areaSqft || !city || !locality) {
      return res.status(400).json({
        success: false,
        message: "title, price, areaSqft, city, and locality are required",
      });
    }

    const images = (req.files || []).map((f) => `/uploads/properties/${f.filename}`);
    if (images.length === 0) {
      return res.status(400).json({ success: false, message: "Please upload at least one photo" });
    }

    // amenities can arrive as a JSON string, a comma-separated string, or an array
    let amenitiesList = [];
    if (Array.isArray(amenities)) amenitiesList = amenities;
    else if (typeof amenities === "string" && amenities.trim()) {
      try {
        const parsed = JSON.parse(amenities);
        amenitiesList = Array.isArray(parsed) ? parsed : amenities.split(",").map((a) => a.trim());
      } catch {
        amenitiesList = amenities.split(",").map((a) => a.trim()).filter(Boolean);
      }
    }

    // Self-service listings go up for a quick admin review before appearing live;
    // admins publish instantly.
    const status = req.user.role === "admin" ? "Active" : "Pending";

    const property = await Property.create({
      title,
      description: description || "",
      propertyType: propertyType || "Apartment",
      listingType: listingType || "Sale",
      price: Number(price),
      areaSqft: Number(areaSqft),
      bhk: Number(bhk) || 1,
      bathrooms: Number(bathrooms) || 1,
      furnishing: furnishing || "Unfurnished",
      floor: Number(floor) || 0,
      totalFloors: Number(totalFloors) || 1,
      ageOfProperty: Number(ageOfProperty) || 0,
      facing: facing || "North",
      amenities: amenitiesList,
      images,
      city,
      locality,
      address: address || "",
      contactPhone: contactPhone || "",
      location: { lat: Number(lat) || 0, lng: Number(lng) || 0 },
      owner: req.user._id,
      source: "Owner",
      status,
    });

    res.status(201).json({
      success: true,
      property,
      message:
        status === "Pending"
          ? "Your property has been submitted and will go live after a quick review."
          : "Property listed successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties/my-listings  (properties the logged-in user has posted)
exports.getMyListings = async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

const canModify = (property, user) =>
  user.role === "admin" || (property.owner && property.owner.toString() === user._id.toString());

exports.updateProperty = async (req, res, next) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Property not found" });
    if (!canModify(existing, req.user)) {
      return res.status(403).json({ success: false, message: "You can only edit your own listings" });
    }
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, property });
  } catch (err) {
    next(err);
  }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Property not found" });
    if (!canModify(existing, req.user)) {
      return res.status(403).json({ success: false, message: "You can only delete your own listings" });
    }
    await existing.deleteOne();
    res.json({ success: true, message: "Property deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/properties/:id/save  (toggle save to wishlist)
exports.toggleSaveProperty = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.savedProperties.findIndex((p) => p.toString() === req.params.id);
    if (idx > -1) {
      user.savedProperties.splice(idx, 1);
    } else {
      user.savedProperties.push(req.params.id);
    }
    await user.save();
    res.json({ success: true, savedProperties: user.savedProperties });
  } catch (err) {
    next(err);
  }
};

// POST /api/properties/compare  { ids: [] }
exports.compareProperties = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length < 2) {
      return res.status(400).json({ success: false, message: "Select at least 2 properties to compare" });
    }
    const properties = await Property.find({ _id: { $in: ids } });
    res.json({ success: true, properties });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties/recommendations  -> proxies to AI service using user prefs + history
exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("viewedProperties").populate("savedProperties");
    const allProps = await Property.find({ status: "Active" });

    const payload = {
      user_preferences: user.preferences,
      viewed_property_ids: user.viewedProperties.map((p) => p._id.toString()),
      saved_property_ids: user.savedProperties.map((p) => p._id.toString()),
      candidate_properties: allProps.map((p) => ({
        id: p._id.toString(),
        price: p.price,
        areaSqft: p.areaSqft,
        bhk: p.bhk,
        city: p.city,
        locality: p.locality,
        propertyType: p.propertyType,
      })),
    };

    const { data } = await axios.post(`${AI_URL}/recommend`, payload, { timeout: 8000 });
    const recommendedIds = data.recommended_ids || [];
    const ordered = recommendedIds
      .map((id) => allProps.find((p) => p._id.toString() === id))
      .filter(Boolean);

    res.json({ success: true, properties: ordered });
  } catch (err) {
    // Fallback: simple heuristic recommendation if AI service is unreachable
    try {
      const user = await User.findById(req.user._id);
      const fallback = await Property.find({
        status: "Active",
        price: { $gte: user.preferences.budgetMin, $lte: user.preferences.budgetMax },
      }).limit(8);
      return res.json({ success: true, properties: fallback, fallback: true });
    } catch (err2) {
      next(err2);
    }
  }
};

// POST /api/properties/predict-price -> proxies to AI service
exports.predictPrice = async (req, res, next) => {
  try {
    const { data } = await axios.post(`${AI_URL}/predict-price`, req.body, { timeout: 8000 });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(502).json({ success: false, message: "AI price prediction service unavailable", error: err.message });
  }
};

// POST /api/properties/forecast -> proxies to AI service (ARIMA/LSTM)
exports.forecastPrice = async (req, res, next) => {
  try {
    const { data } = await axios.post(`${AI_URL}/forecast-price`, req.body, { timeout: 10000 });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(502).json({ success: false, message: "AI forecasting service unavailable", error: err.message });
  }
};

// POST /api/properties/interior-design -> proxies to AI service (image ideas + tips)
exports.interiorDesign = async (req, res, next) => {
  try {
    const { roomType, style, notes } = req.body;
    if (!roomType || !style) {
      return res.status(400).json({ success: false, message: "roomType and style are required" });
    }
    const { data } = await axios.post(
      `${AI_URL}/interior-design`,
      { room_type: roomType, style, notes: notes || "" },
      { timeout: 20000 }
    );
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(502).json({ success: false, message: "AI interior design service unavailable", error: err.message });
  }
};

// EMI calculator - pure math, no need for AI service
exports.calculateEMI = async (req, res, next) => {
  try {
    const { loanAmount, interestRate, tenureYears } = req.body;
    if (!loanAmount || !interestRate || !tenureYears) {
      return res.status(400).json({ success: false, message: "loanAmount, interestRate, tenureYears are required" });
    }
    const P = Number(loanAmount);
    const R = Number(interestRate) / 12 / 100;
    const N = Number(tenureYears) * 12;
    const emi = R === 0 ? P / N : (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    const totalPayment = emi * N;
    const totalInterest = totalPayment - P;

    const schedule = [];
    let balance = P;
    for (let m = 1; m <= N; m++) {
      const interestComp = balance * R;
      const principalComp = emi - interestComp;
      balance -= principalComp;
      if (m <= 12 || m % 12 === 0) {
        schedule.push({
          month: m,
          principal: Math.round(principalComp),
          interest: Math.round(interestComp),
          balance: Math.max(0, Math.round(balance)),
        });
      }
    }

    res.json({
      success: true,
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principal: P,
      schedule,
    });
  } catch (err) {
    next(err);
  }
};
