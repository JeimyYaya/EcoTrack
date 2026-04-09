export type FootprintLine = {
  label: string;
  kg: number;
};

export type EstimateResult = {
  totalKg: number;
  lines: FootprintLine[];
  note: string;
};

type Rule = {
  keywords: string[];
  label: string;
  kgCo2: number;
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
  { keywords: ["takeout", "delivery", "packaging", "disposable"], label: "Takeout / packaging waste", kgCo2: 0.5 },
];

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

export function estimateDailyFootprint(description: string): EstimateResult {
  const text = normalize(description);
  if (!text) {
    return {
      totalKg: 0,
      lines: [],
      note: "Describe your day above. We match keywords (food, transport, home) to rough daily CO₂ equivalents in kg.",
    };
  }

  const lines: FootprintLine[] = [];
  const matchedRuleLabels = new Set<string>();

  for (const rule of RULES) {
    const hit = rule.keywords.some((kw) => keywordMatches(text, kw));
    if (!hit) continue;
    if (matchedRuleLabels.has(rule.label)) continue;
    matchedRuleLabels.add(rule.label);
    lines.push({ label: rule.label, kg: rule.kgCo2 });
  }

  const totalKg = Math.max(0, lines.reduce((sum, l) => sum + l.kg, 0));

  let note: string;
  if (lines.length === 0) {
    note =
      "No specific keywords detected. Try mentioning meals (e.g. chicken, beef), transport (car, train, flight), or home energy (AC, shower).";
  } else {
    note =
      "Rough order-of-magnitude estimate for illustration. Real footprint depends on distance, portions, and local grid mix.";
  }

  return { totalKg, lines, note };
}
