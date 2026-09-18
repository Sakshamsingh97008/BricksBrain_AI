require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Property = require("./models/Property");

const cities = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Gurugram", "Noida"];
const localities = {
  Bangalore: ["Whitefield", "Koramangala", "HSR Layout", "Electronic City"],
  Mumbai: ["Andheri", "Powai", "Thane", "Bandra"],
  Delhi: ["Dwarka", "Rohini", "Saket", "Vasant Kunj"],
  Pune: ["Hinjewadi", "Baner", "Kothrud", "Wakad"],
  Hyderabad: ["Gachibowli", "Madhapur", "Kondapur", "Kukatpally"],
  Chennai: ["OMR", "Velachery", "Anna Nagar", "T Nagar"],
  Gurugram: ["Sector 49", "Sohna Road", "DLF Phase 3", "Sector 82"],
  Noida: ["Sector 62", "Sector 137", "Sector 150", "Greater Noida West"],
};
const types = ["Apartment", "Villa", "Independent House", "Plot", "Studio"];
const amenitiesList = ["Swimming Pool", "Gym", "Clubhouse", "24x7 Security", "Power Backup", "Children's Play Area", "Park", "Covered Parking", "Lift", "Rainwater Harvesting"];
const propertyImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=600&q=85",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&h=600&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&h=600&q=85",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&h=600&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&h=600&q=85",
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sample(arr, n) { return [...arr].sort(() => 0.5 - Math.random()).slice(0, n); }

const seed = async () => {
  await connectDB();
  await Property.deleteMany({});
  const adminExists = await User.findOne({ email: "admin@bricksbrain.ai" });
  if (!adminExists) {
    await User.create({ name: "Admin", email: "admin@bricksbrain.ai", password: "admin123", role: "admin" });
    console.log("Admin created: admin@bricksbrain.ai / admin123");
  }
  const demoExists = await User.findOne({ email: "demo@bricksbrain.ai" });
  if (!demoExists) {
    await User.create({ name: "Demo User", email: "demo@bricksbrain.ai", password: "demo1234", role: "user" });
    console.log("Demo user created: demo@bricksbrain.ai / demo1234");
  }

  const properties = [];
  for (let i = 0; i < 120; i++) {
    const city = rand(cities);
    const locality = rand(localities[city]);
    const bhk = randInt(1, 5);
    const areaSqft = bhk * randInt(400, 650) + randInt(-100, 200);
    const basePricePerSqft = randInt(3500, 15000);
    const price = Math.round(areaSqft * basePricePerSqft);
    const propertyType = rand(types);

    properties.push({
      title: `${bhk} BHK ${propertyType} in ${locality}, ${city}`,
      description: `A beautiful ${bhk} BHK ${propertyType.toLowerCase()} located in the heart of ${locality}, ${city}. Close to schools, hospitals, and IT parks with excellent connectivity.`,
      propertyType,
      listingType: Math.random() > 0.25 ? "Sale" : "Rent",
      price: propertyType === "Plot" ? Math.round(areaSqft * randInt(2000, 6000)) : price,
      areaSqft,
      bhk,
      bathrooms: Math.max(1, bhk - randInt(0, 1)),
      furnishing: rand(["Unfurnished", "Semi-Furnished", "Furnished"]),
      floor: randInt(0, 20),
      totalFloors: randInt(5, 25),
      ageOfProperty: randInt(0, 15),
      facing: rand(["North", "South", "East", "West", "North-East", "South-West"]),
      amenities: sample(amenitiesList, randInt(4, 8)),
      images: [
        propertyImages[i % propertyImages.length],
        propertyImages[(i + 1) % propertyImages.length],
        propertyImages[(i + 2) % propertyImages.length],
      ],
      city,
      locality,
      address: `${randInt(1, 200)}, ${locality} Main Road, ${city}`,
      location: { lat: 12.9 + Math.random() * 8, lng: 77.5 + Math.random() * 5 },
      areaIntelligence: {
        walkScore: randInt(40, 95),
        safetyScore: randInt(50, 98),
        connectivityScore: randInt(45, 97),
        nearbySchools: randInt(2, 15),
        nearbyHospitals: randInt(1, 10),
        priceGrowth5yr: randInt(15, 65),
      },
      isFeatured: i < 12,
      status: "Active",
      views: randInt(10, 2000),
    });
  }
  await Property.insertMany(properties);
  console.log(`Seeded ${properties.length} properties.`);
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
