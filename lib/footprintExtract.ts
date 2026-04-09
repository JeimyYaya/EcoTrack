export type ActivityCategory = "transport" | "energy" | "food" | "other";

/** Serializable extraction result (suitable for JSON.stringify). */
export type StructuredActivity = {
  category: ActivityCategory;
  /** Stable id, e.g. electricity_kwh, delivery_truck */
  kind: string;
  quantity: number;
  unit: string;
  /** Original phrase we matched */
  rawSpan: string;
};

export type StructuredFootprint = {
  sourceText: string;
  activities: StructuredActivity[];
};

type Span = { start: number; end: number };

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Pull quantified activities from natural language into structured JSON.
 * Heuristics only — not a full NLP pipeline.
 */
export function parseNaturalLanguageToStructured(input: string): StructuredFootprint {
  const sourceText = normalize(input);
  if (!sourceText) {
    return { sourceText: "", activities: [] };
  }

  const lower = sourceText.toLowerCase();
  const activities: StructuredActivity[] = [];
  const usedSpans: Span[] = [];

  function tryClaim(span: Span): boolean {
    if (usedSpans.some((u) => overlaps(u, span))) return false;
    usedSpans.push(span);
    return true;
  }

  // --- Energy: kWh / MWh (allow 200kWh, 200 kwh, 1.5 MWh — "k" in kWh is not a thousands prefix)
  const energyRe =
    /(\d+(?:\.\d+)?)\s*(mwh|kwh|kilowatt[-\s]?hours?|megawatt[-\s]?hours?)\b/gi;
  let em: RegExpExecArray | null;
  while ((em = energyRe.exec(lower)) !== null) {
    const full = em[0];
    const start = em.index;
    const end = start + full.length;
    if (!tryClaim({ start, end })) continue;

    let quantity = parseFloat(em[1]);
    const unitWord = em[2].toLowerCase().replace(/\s+/g, "");

    const unit = "kWh";
    if (unitWord.startsWith("mw") || unitWord.includes("megawatt")) {
      quantity *= 1000;
    }

    activities.push({
      category: "energy",
      kind: "electricity_kwh",
      quantity,
      unit,
      rawSpan: sourceText.slice(start, end),
    });
  }

  // --- Transport: N (delivery) trucks / vans / cars / buses / flights
  const transportPatterns: Array<{
    re: RegExp;
    kind: string;
    unit: string;
  }> = [
    {
      re: /(\d+(?:\.\d+)?)\s*(delivery\s+)?(trucks?|lorries)\b/gi,
      kind: "delivery_truck",
      unit: "vehicle",
    },
    { re: /(\d+(?:\.\d+)?)\s*vans?\b/gi, kind: "van", unit: "vehicle" },
    { re: /(\d+(?:\.\d+)?)\s*(cars?|suvs?)\b/gi, kind: "car_fleet", unit: "vehicle" },
    { re: /(\d+(?:\.\d+)?)\s*buses?\b/gi, kind: "bus_fleet", unit: "vehicle" },
    { re: /(\d+(?:\.\d+)?)\s*(flights?|planes?)\b/gi, kind: "flight_legs", unit: "leg" },
  ];

  for (const { re, kind, unit } of transportPatterns) {
    re.lastIndex = 0;
    let tm: RegExpExecArray | null;
    while ((tm = re.exec(lower)) !== null) {
      const full = tm[0];
      const start = tm.index;
      const end = start + full.length;
      if (!tryClaim({ start, end })) continue;

      const quantity = parseFloat(tm[1]);
      activities.push({
        category: "transport",
        kind,
        quantity,
        unit,
        rawSpan: sourceText.slice(start, end),
      });
    }
  }

  // --- "trucks and" style: number before list (5 trucks and 2 vans) — already handled per pattern

  // --- Food / other: optional leading number + keyword (e.g. "3 beef meals")
  const foodPatterns: Array<{ re: RegExp; kind: string; unit: string }> = [
    { re: /(\d+(?:\.\d+)?)\s*(beef|steak|lamb)\s+meals?\b/gi, kind: "meal_red_meat", unit: "meal" },
    { re: /(\d+(?:\.\d+)?)\s*(chicken|poultry)\s+meals?\b/gi, kind: "meal_poultry", unit: "meal" },
  ];

  for (const { re, kind, unit } of foodPatterns) {
    re.lastIndex = 0;
    let fm: RegExpExecArray | null;
    while ((fm = re.exec(lower)) !== null) {
      const full = fm[0];
      const start = fm.index;
      const end = start + full.length;
      if (!tryClaim({ start, end })) continue;
      activities.push({
        category: "food",
        kind,
        quantity: parseFloat(fm[1]),
        unit,
        rawSpan: sourceText.slice(start, end),
      });
    }
  }

  return { sourceText, activities };
}

/** Pretty JSON for UI / debugging */
export function structuredFootprintToJson(s: StructuredFootprint): string {
  return JSON.stringify(s, null, 2);
}
