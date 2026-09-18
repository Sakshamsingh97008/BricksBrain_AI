const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const PROPERTY_TYPE_IMAGES = {
  Apartment: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
  Villa: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80",
  "Independent House": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
  Plot: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
  Commercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  Studio: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
};

const DEFAULT_SEED_IMAGE_PATTERNS = [
  "photo-1600585154340-be6161a56a0c",
  "photo-1600607687920-4e2a09cf159d",
  "photo-1600047509807-ba8f99d2cdde",
  "photo-1600585154526-990dced4db0d",
  "photo-1600566753086-00f18fb6b3ea",
];

function isDefaultSeedImage(src) {
  if (!src) return false;
  return DEFAULT_SEED_IMAGE_PATTERNS.some((pattern) => String(src).includes(pattern));
}

export function getImageUrl(src) {
  if (!src || /^(https?:|data:|blob:)/i.test(src)) return src;
  return `${API_ORIGIN}${src.startsWith("/") ? src : `/${src}`}`;
}

export function getPropertyTypeImage(propertyType) {
  const normalizedType = String(propertyType || "Apartment").trim();
  if (PROPERTY_TYPE_IMAGES[normalizedType]) return PROPERTY_TYPE_IMAGES[normalizedType];

  const lower = normalizedType.toLowerCase();
  if (lower.includes("villa")) return PROPERTY_TYPE_IMAGES.Villa;
  if (lower.includes("plot") || lower.includes("land")) return PROPERTY_TYPE_IMAGES.Plot;
  if (lower.includes("commercial") || lower.includes("office")) return PROPERTY_TYPE_IMAGES.Commercial;
  if (lower.includes("studio")) return PROPERTY_TYPE_IMAGES.Studio;
  if (lower.includes("house") || lower.includes("independent")) return PROPERTY_TYPE_IMAGES["Independent House"];
  return PROPERTY_TYPE_IMAGES.Apartment;
}

export function getPropertyImage(property) {
  const propertyType = property?.propertyType;
  const typeImage = getPropertyTypeImage(propertyType);
  const images = Array.isArray(property?.images) ? property.images.filter(Boolean) : [];

  const hasDefaultSeedImages = images.some(isDefaultSeedImage);
  if (hasDefaultSeedImages || (!images.length && propertyType)) {
    return typeImage;
  }

  if (images.length > 0) return getImageUrl(images[0]);
  return typeImage;
}

export function getPropertyGalleryImages(property) {
  const propertyType = property?.propertyType;
  const typeImage = getPropertyTypeImage(propertyType);
  const images = Array.isArray(property?.images) ? property.images.filter(Boolean) : [];

  if (images.length > 0 && !images.some(isDefaultSeedImage)) {
    return images.map(getImageUrl);
  }

  return [typeImage];
}