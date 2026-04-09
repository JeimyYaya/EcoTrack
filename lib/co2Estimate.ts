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

/**
 * Compute total kg CO₂-eq from structured extraction + keyword fallback.
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

  const structuredLines = linesFromStructuredActivities(structured.activities);
  const keywordLines = linesFromKeywords(normalizedText, structured);
  const lines = [...structuredLines, ...keywordLines];
  const totalKg = totalKgCo2eFromLines(lines);

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

  return { totalKg, lines, note, structured };
}

export function estimateDailyFootprint(description: string): EstimateResult {
  const structured = parseNaturalLanguageToStructured(description);
  const text = normalize(description);
  return estimateFromStructured(structured, text);
}
