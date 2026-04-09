/**
 * Keyword-based daily-style defaults (kg CO₂-eq). Tune in one place; add rules by appending entries.
 */
export type KeywordEmissionRule = {
  keywords: string[];
  label: string;
  kgCo2: number;
  skipWhen?: (normalizedText: string) => boolean;
};

export const KEYWORD_EMISSION_RULES: KeywordEmissionRule[] = [
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
