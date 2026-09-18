import jsPDF from "jspdf";
import { formatPrice } from "../components/PropertyCard";

const BRAND_RED = [230, 57, 70];
const INK = [26, 26, 46];
const GREY = [110, 110, 120];

/**
 * Generates a downloadable PDF report for a property: key details, description,
 * amenities, area intelligence, AI price prediction/forecast (if available), and EMI.
 */
export function generatePropertyReport(property, { prediction, forecast, emi } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 0;

  // Header band
  doc.setFillColor(...BRAND_RED);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("BricksBrain AI", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Property Report", margin, 50);
  doc.text(new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }), pageWidth - margin, 50, { align: "right" });

  y = 100;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(property.title, margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`${property.address ? property.address + ", " : ""}${property.locality}, ${property.city}`, margin, y);
  y += 24;

  doc.setTextColor(...BRAND_RED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(formatPrice(property.price), margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`₹${Math.round(property.price / property.areaSqft).toLocaleString("en-IN")}/sqft`, margin + 140, y);
  y += 26;

  // Key specs table
  const specs = [
    ["Property Type", property.propertyType],
    ["Listing Type", `For ${property.listingType}`],
    ["BHK", `${property.bhk} BHK`],
    ["Bathrooms", String(property.bathrooms)],
    ["Area", `${property.areaSqft} sqft`],
    ["Furnishing", property.furnishing],
    ["Floor", `${property.floor}/${property.totalFloors}`],
    ["Facing", property.facing],
    ["Age", `${property.ageOfProperty} yrs`],
  ];
  y = drawKeyValueGrid(doc, specs, margin, y, pageWidth - margin * 2, 3);
  y += 16;

  if (property.description) {
    y = sectionHeading(doc, "Description", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(property.description, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 14;
  }

  if (property.amenities?.length) {
    y = sectionHeading(doc, "Amenities", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const text = property.amenities.join("   •   ");
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 14;
  }

  if (property.areaIntelligence) {
    y = sectionHeading(doc, "Area Intelligence", margin, y);
    const ai = property.areaIntelligence;
    const rows = [
      ["Walk Score", ai.walkScore], ["Safety Score", ai.safetyScore], ["Connectivity", ai.connectivityScore],
      ["Nearby Schools", ai.nearbySchools], ["Nearby Hospitals", ai.nearbyHospitals], ["5yr Price Growth", `${ai.priceGrowth5yr}%`],
    ];
    y = drawKeyValueGrid(doc, rows, margin, y, pageWidth - margin * 2, 3);
    y += 16;
  }

  if (prediction && !prediction.error) {
    y = checkPageBreak(doc, y, margin);
    y = sectionHeading(doc, "AI Price Prediction", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Estimated price: ${formatPrice(prediction.predicted_price)}  (range: ${formatPrice(prediction.price_range.min)} - ${formatPrice(prediction.price_range.max)})`,
      margin, y, { maxWidth: pageWidth - margin * 2 }
    );
    y += 18;
  }

  if (forecast && !forecast.error && forecast.summary) {
    y = checkPageBreak(doc, y, margin);
    y = sectionHeading(doc, "Price Forecast", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `1yr (ARIMA): ${formatPrice(forecast.summary.forecast_1yr_arima)}   |   3yr (ARIMA): ${formatPrice(forecast.summary.forecast_3yr_arima)}`,
      margin, y
    );
    y += 18;
  }

  if (emi) {
    y = checkPageBreak(doc, y, margin);
    y = sectionHeading(doc, "EMI Estimate", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Monthly EMI: ${formatPrice(emi.emi)}   |   Total Interest: ${formatPrice(emi.totalInterest)}   |   Total Payment: ${formatPrice(emi.totalPayment)}`,
      margin, y, { maxWidth: pageWidth - margin * 2 }
    );
    y += 18;
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text("Generated by BricksBrain AI — bricksbrain.ai", margin, doc.internal.pageSize.getHeight() - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  const filename = `${property.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.pdf`;
  doc.save(filename);
}

function sectionHeading(doc, text, x, y) {
  y = checkPageBreak(doc, y, x);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(text, x, y);
  return y + 16;
}

function checkPageBreak(doc, y, margin) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 80) {
    doc.addPage();
    return margin + 20;
  }
  return y;
}

function drawKeyValueGrid(doc, pairs, x, y, totalWidth, cols) {
  const colWidth = totalWidth / cols;
  const rowHeight = 30;
  doc.setFontSize(8.5);
  pairs.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * colWidth;
    const cy = y + row * rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    doc.text(String(label), cx, cy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(String(value), cx, cy + 13);
  });
  const rows = Math.ceil(pairs.length / cols);
  return y + rows * rowHeight;
}
