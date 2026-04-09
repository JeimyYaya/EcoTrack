import {
  parseNaturalLanguageToStructured,
  type StructuredActivity,
  type StructuredFootprint,
} from "@/lib/footprintExtract";
import { structuredActivityToFootprintLine, totalKgCo2eFromLines } from "@/lib/emissionFactors";
import { KEYWORD_EMISSION_RULES } from "@/lib/keywordEmissionRules";

export type FootprintLine = {
  label: string;
  kg: number;
};

export type EstimateResult = {
  totalKg: number;
  lines: FootprintLine[];
  note: string;
  structured: StructuredFootprint;
  /** Short assistant-style explanation of how the total was derived. */
  howCalculated: string;
  /** One or two practical reduction ideas tailored to detected activities. */
  suggestions: string[];
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

function hasStructuredEnergy(activities: StructuredActivity[]): boolean {
  return activities.some((a) => a.category === "energy" && a.kind === "electricity_kwh");
}

function hasStructuredFlightCount(activities: StructuredActivity[]): boolean {
  return activities.some((a) => a.category === "transport" && a.kind === "flight_legs");
}

function linesFromStructuredActivities(activities: StructuredActivity[]): FootprintLine[] {
  const out: FootprintLine[] = [];
  for (const act of activities) {
    const line = structuredActivityToFootprintLine(act);
    if (line) out.push(line);
  }
  return out;
}

function linesFromKeywords(normalizedText: string, structured: StructuredFootprint): FootprintLine[] {
  const lines: FootprintLine[] = [];
  const matchedRuleLabels = new Set<string>();
  const skipElectricityKeyword = hasStructuredEnergy(structured.activities);
  const skipAirKeyword = hasStructuredFlightCount(structured.activities);

  for (const rule of KEYWORD_EMISSION_RULES) {
    if (rule.skipWhen?.(normalizedText)) continue;
    if (rule.label === "Home electricity / devices" && skipElectricityKeyword) continue;
    if (rule.label === "Air travel" && skipAirKeyword) continue;

    const hit = rule.keywords.some((kw) => keywordMatches(normalizedText, kw));
    if (!hit) continue;
    if (matchedRuleLabels.has(rule.label)) continue;
    matchedRuleLabels.add(rule.label);
    lines.push({ label: rule.label, kg: rule.kgCo2 });
  }

  return lines;
}

function buildHowCalculated(
  structured: StructuredFootprint,
  structuredLines: FootprintLine[],
  keywordLines: FootprintLine[],
  lines: FootprintLine[],
): string {
  if (lines.length === 0) return "";

  const a = structured.activities;
  const chunks: string[] = [];

  const kwh = a.find((x) => x.kind === "electricity_kwh");
  if (kwh) {
    chunks.push(`${kwh.quantity} kWh was multiplied by a medium grid emission factor (kg CO₂e per kWh)`);
  }

  const transport = a.filter((x) => x.category === "transport");
  if (transport.length > 0) {
    chunks.push(
      "vehicle or flight counts were multiplied by per‑unit factors (heavy trucks use a higher intensity than vans or cars)",
    );
  }

  const food = a.filter((x) => x.category === "food");
  if (food.length > 0) {
    chunks.push("meal counts were multiplied by per‑meal food benchmarks");
  }

  if (keywordLines.length > 0) {
    chunks.push("extra phrases in your text were matched to simple daily‑style defaults and added as separate line items");
  }

  if (chunks.length === 0 && keywordLines.length > 0) {
    return "I matched phrases in your message to typical daily CO₂-equivalent benchmarks, then added those contributions together.";
  }

  if (chunks.length === 0) return "";

  const detail = chunks.join("; ");
  return `Here's how I got there: ${detail}. The headline total is the sum of the rows below (in kg CO₂-equivalent).`;
}

function buildSuggestions(structured: StructuredFootprint, lines: FootprintLine[]): string[] {
  const out: string[] = [];
  const kinds = new Set(structured.activities.map((x) => x.kind));
  const labelBlob = lines.map((l) => l.label.toLowerCase()).join(" ");

  if (kinds.has("electricity_kwh")) {
    out.push(
      "Where you can, shift flexible load to cleaner power or a verified green tariff, and trim always‑on equipment.",
    );
  }
  if (kinds.has("delivery_truck") || labelBlob.includes("delivery truck")) {
    out.push("Fewer, fuller truck runs and better routing usually beat small tweaks—plan loads to cut empty kilometers.");
  }
  if (out.length < 2 && (kinds.has("flight_legs") || /\bflight|plane|flying\b/.test(labelBlob))) {
    out.push("Replacing short legs with rail (or one well‑planned trip instead of many) often cuts aviation‑linked emissions.");
  }
  if (out.length < 2 && (labelBlob.includes("red meat") || labelBlob.includes("beef") || labelBlob.includes("lamb"))) {
    out.push("Swapping an occasional red‑meat meal for poultry or plant‑based options reduces food‑related emissions.");
  }
  if (out.length < 2 && labelBlob.includes("car (personal)")) {
    out.push("Bundling errands and avoiding cold starts where possible keeps car‑related emissions lower.");
  }
  if (out.length < 2 && kinds.has("van")) {
    out.push("Right‑sizing vehicles to the load avoids hauling empty capacity on every run.");
  }

  if (out.length === 0 && lines.length > 0) {
    out.push("Focus on the largest line items first—small changes to the biggest contributors usually move the total most.");
  }

  return out.slice(0, 2);
}

/**
 * Compute total kg CO₂-eq from structured extraction + keyword fallback.
 */
export function estimateFromStructured(structured: StructuredFootprint, normalizedText: string): EstimateResult {
  if (!normalizedText) {
    return {
      totalKg: 0,
      lines: [],
      structured,
      howCalculated: "",
      suggestions: [],
      note: "Describe your day above. We extract numbers (e.g. trucks, kWh), detect transport/energy/food, then match remaining keywords.",
    };
  }

  const structuredLines = linesFromStructuredActivities(structured.activities);
  const keywordLines = linesFromKeywords(normalizedText, structured);
  const lines = [...structuredLines, ...keywordLines];
  const totalKg = totalKgCo2eFromLines(lines);

  const howCalculated = buildHowCalculated(structured, structuredLines, keywordLines, lines);
  const suggestions = buildSuggestions(structured, lines);

  let note: string;
  if (structured.activities.length === 0 && lines.length === 0) {
    note =
      "No quantities or keywords detected. Try e.g. “5 delivery trucks and 200 kWh”, or meals and transport (car, train, flight).";
  } else if (lines.length === 0) {
    note = "Parsed some text but could not map it to emission factors. Add units (kWh) or vehicle counts.";
  } else {
    note =
      "Totals are kg CO₂-eq (structured factors from lib/emissionFactors.ts; keywords use daily defaults). Refine with your grid factor, routes, and load factors.";
  }

  return { totalKg, lines, note, structured, howCalculated, suggestions };
}

export function estimateDailyFootprint(description: string): EstimateResult {
  const structured = parseNaturalLanguageToStructured(description);
  const text = normalize(description);
  return estimateFromStructured(structured, text);
}
