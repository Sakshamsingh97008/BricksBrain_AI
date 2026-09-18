const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin", "agent"], default: "user" },
    preferences: {
      budgetMin: { type: Number, default: 0 },
      budgetMax: { type: Number, default: 10000000 },
      preferredCities: [{ type: String }],
      propertyTypes: [{ type: String }],
      bhk: [{ type: Number }],
    },
    savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
    viewedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
    comparisonList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
