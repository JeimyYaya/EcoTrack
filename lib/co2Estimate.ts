import {
  parseNaturalLanguageToStructured,
  type StructuredActivity,
  type StructuredFootprint,
} from "@/lib/footprintExtract";

export type FootprintLine = {
  label: string;
  kg: number;
};

export type EstimateResult = {
  totalKg: number;
  lines: FootprintLine[];
  note: string;
  /** Parsed activities + source text (JSON-serializable). */
  structured: StructuredFootprint;
};

type Rule = {
  keywords: string[];
  label: string;
  kgCo2: number;
  /** Skip entire rule when this returns true */
  skipWhen?: (normalizedText: string) => boolean;
};

const RULES: Rule[] = [
  { keywords: ["beef", "steak", "lamb", "burger"], label: "Red meat (beef / lamb)", kgCo2: 6.5 },
  { keywords: ["pork", "bacon", "ham", "sausage"], label: "Pork products", kgCo2: 3.8 },
  { keywords: ["chicken", "turkey", "poultry"], label: "Poultry", kgCo2: 2.2 },
  { keywords: ["fish", "salmon", "tuna", "seafood"], label: "Fish / seafood", kgCo2: 2.0 },
  { keywords: ["meat", "ribs"], label: "Other meat", kgCo2: 4.0 },
  { keywords: ["vegan", "plant-based", "tofu", "legume"], label: "Low-impact plant foods", kgCo2: -0.8 },
  { keywords: ["vegetarian", "salad", "vegetables"], label: "Vegetarian meal", kgCo2: -0.3 },
  { keywords: ["dairy", "cheese", "milk", "yogurt", "butter"], label: "Dairy", kgCo2: 1.4 },
  { keywords: ["flight", "plane", "flew", "flying", "airport", "air travel"], label: "Air travel", kgCo2: 18 },
  { keywords: ["car", "drove", "driving", "drive", "suv", "gasoline", "petrol"], label: "Car (personal)", kgCo2: 5.5 },
  { keywords: ["taxi", "uber", "lyft", "rideshare"], label: "Taxi / rideshare", kgCo2: 3.0 },
  { keywords: ["bus", "coach"], label: "Bus", kgCo2: 1.1 },
  { keywords: ["train", "subway", "metro", "tram", "rail"], label: "Train / metro", kgCo2: 0.9 },
  { keywords: ["bike", "bicycle", "cycling", "ebike"], label: "Cycling", kgCo2: 0.05 },
  { keywords: ["walk", "walking", "on foot"], label: "Walking", kgCo2: 0.02 },
  { keywords: ["electricity", "lights", "screen time", "computer"], label: "Home electricity / devices", kgCo2: 1.2 },
  { keywords: ["air conditioning", "heating", "heater"], label: "Heating / cooling", kgCo2: 2.0 },
  { keywords: ["shower", "long shower", "bath"], label: "Hot water (shower / bath)", kgCo2: 0.6 },
  {
    keywords: ["takeout", "delivery", "packaging", "disposable"],
    label: "Takeout / packaging waste",
    kgCo2: 0.5,
    skipWhen: (t) =>
      /\bdelivery\s+(trucks?|lorries)\b/i.test(t) ||
      /\b\d+(?:\.\d+)?\s*(delivery\s+)?(trucks?|lorries)\b/i.test(t),
  },
];

/** Illustrative grid intensity (kg CO₂-eq per kWh). */
const KG_CO2_PER_KWH = 0.42;

const STRUCTURED_TRANSPORT: Record<string, { label: string; kgPerUnit: number }> = {
  delivery_truck: { label: "Delivery trucks (per vehicle·day, illustrative)", kgPerUnit: 26 },
  van: { label: "Vans (per vehicle·day, illustrative)", kgPerUnit: 16 },
  car_fleet: { label: "Cars / SUVs (per vehicle·day)", kgPerUnit: 5.5 },
  bus_fleet: { label: "Buses (per vehicle·day, illustrative)", kgPerUnit: 22 },
  flight_legs: { label: "Flight legs (per leg, illustrative)", kgPerUnit: 18 },
};

const STRUCTURED_FOOD: Record<string, { label: string; kgPerMeal: number }> = {
  meal_red_meat: { label: "Red-meat meals", kgPerMeal: 6.5 },
  meal_poultry: { label: "Poultry meals", kgPerMeal: 2.2 },
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordMatches(text: string, keyword: string): boolean {
  const kw = keyword.toLowerCase();
  if (kw.includes(" ")) {
    return text.includes(kw);
  }
  return new RegExp(`\\b${escapeRegex(kw)}\\b`, "i").test(text);
}

function linesFromStructuredActivity(act: StructuredActivity): FootprintLine | null {
  if (act.category === "energy" && act.kind === "electricity_kwh") {
    const kg = act.quantity * KG_CO2_PER_KWH;
    return {
      label: `Grid electricity (${act.quantity} ${act.unit} × ${KG_CO2_PER_KWH} kg/kWh, illustrative)`,
      kg,
    };
  }

  if (act.category === "transport") {
    const spec = STRUCTURED_TRANSPORT[act.kind];
    if (!spec) return null;
    const kg = spec.kgPerUnit * act.quantity;
    return {
      label: `${spec.label} × ${act.quantity} ${act.unit}`,
      kg,
    };
  }

  if (act.category === "food") {
    const spec = STRUCTURED_FOOD[act.kind];
    if (!spec) return null;
    const kg = spec.kgPerMeal * act.quantity;
    return {
      label: `${spec.label} × ${act.quantity} ${act.unit}`,
      kg,
    };
  }

  return null;
}

function hasStructuredEnergy(activities: StructuredActivity[]): boolean {
  return activities.some((a) => a.category === "energy" && a.kind === "electricity_kwh");
}

function hasStructuredFlightCount(activities: StructuredActivity[]): boolean {
  return activities.some((a) => a.category === "transport" && a.kind === "flight_legs");
}

/**
 * Compute footprint from structured extraction plus keyword fallback on the same text.
 */
export function estimateFromStructured(structured: StructuredFootprint, normalizedText: string): EstimateResult {
  if (!normalizedText) {
    return {
      totalKg: 0,
      lines: [],
      structured,
      note: "Describe your day above. We extract numbers (e.g. trucks, kWh), detect transport/energy/food, then match remaining keywords.",
    };
  }

  const lines: FootprintLine[] = [];
  const matchedRuleLabels = new Set<string>();

  for (const act of structured.activities) {
    const line = linesFromStructuredActivity(act);
    if (line) lines.push(line);
  }

  const skipElectricityKeyword = hasStructuredEnergy(structured.activities);
  const skipAirKeyword = hasStructuredFlightCount(structured.activities);

  for (const rule of RULES) {
    if (rule.skipWhen?.(normalizedText)) continue;
    if (rule.label === "Home electricity / devices" && skipElectricityKeyword) continue;
    if (rule.label === "Air travel" && skipAirKeyword) continue;

    const hit = rule.keywords.some((kw) => keywordMatches(normalizedText, kw));
    if (!hit) continue;
    if (matchedRuleLabels.has(rule.label)) continue;
    matchedRuleLabels.add(rule.label);
    lines.push({ label: rule.label, kg: rule.kgCo2 });
  }

  const totalKg = Math.max(0, lines.reduce((sum, l) => sum + l.kg, 0));

  let note: string;
  if (structured.activities.length === 0 && lines.length === 0) {
    note =
      "No quantities or keywords detected. Try e.g. “5 delivery trucks and 200 kWh”, or meals and transport (car, train, flight).";
  } else if (lines.length === 0) {
    note = "Parsed some text but could not map it to emission factors. Add units (kWh) or vehicle counts.";
  } else {
    note =
      "Rough order-of-magnitude estimate. Quantified items use simple intensities; keywords use daily-style defaults. Real results depend on routes, load, and grid mix.";
  }

  return { totalKg, lines, note, structured };
}

export function estimateDailyFootprint(description: string): EstimateResult {
  const structured = parseNaturalLanguageToStructured(description);
  const text = normalize(description);
  return estimateFromStructured(structured, text);
}
