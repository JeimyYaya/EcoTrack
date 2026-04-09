import type { StructuredActivity } from "@/lib/footprintExtract";

/**
 * Central emission factors (kg CO₂-eq). Extend by adding entries to the registries below
 * and handling new `kind` values in `structuredActivityToFootprintLine`.
 *
 * Sources are order-of-magnitude: grid mixes (IEA / eGRID-style), road freight (DEFRA / EPA MOVES class proxies).
 */

/** Grid electricity — medium carbon intensity (typical mixed / regional average). */
export const GRID_KG_CO2E_PER_KWH = 0.41;

export const gridElectricityFactor = {
  id: "electricity_kwh" as const,
  displayName: "Grid electricity",
  kgCo2ePerKwh: GRID_KG_CO2E_PER_KWH,
  /** Short rationale for UI / methodology */
  basis:
    "Medium grid (~0.41 kg CO₂e/kWh): between low-carbon and coal-heavy systems; refine with your country factor.",
} as const;

export type StructuredTransportFactor = {
  displayName: string;
  /** kg CO₂-eq per counting unit (vehicle·day, leg, etc.) */
  kgCo2ePerUnit: number;
  /** Shown in labels, e.g. vehicle·day, leg */
  unitName: string;
  basis: string;
};

/**
 * Structured transport factors (kg CO₂e per unit).
 * Trucks use a high road-freight intensity vs vans/cars.
 */
export const structuredTransportFactors: Record<string, StructuredTransportFactor> = {
  delivery_truck: {
    displayName: "Delivery trucks (diesel, high intensity)",
    kgCo2ePerUnit: 52,
    unitName: "vehicle·day",
    basis:
      "~150 km equivalent / loaded urban-regional rigid HGV (high vs light vehicles; refine with distance & fuel).",
  },
  van: {
    displayName: "Vans (diesel / mixed)",
    kgCo2ePerUnit: 14,
    unitName: "vehicle·day",
    basis: "Light commercial daily use proxy.",
  },
  car_fleet: {
    displayName: "Cars / SUVs",
    kgCo2ePerUnit: 5.5,
    unitName: "vehicle·day",
    basis: "Single-occupancy gasoline proxy per vehicle·day.",
  },
  bus_fleet: {
    displayName: "Buses",
    kgCo2ePerUnit: 20,
    unitName: "vehicle·day",
    basis: "Diesel transit coach per vehicle·day (shared load; lower per passenger).",
  },
  flight_legs: {
    displayName: "Flight legs",
    kgCo2ePerUnit: 18,
    unitName: "leg",
    basis: "Aligns with keyword “Air travel” default; refine with distance & cabin class.",
  },
};

export type StructuredTransportKind = keyof typeof structuredTransportFactors;

export const structuredFoodFactors = {
  meal_red_meat: { displayName: "Red-meat meals", kgCo2ePerMeal: 6.5 },
  meal_poultry: { displayName: "Poultry meals", kgCo2ePerMeal: 2.2 },
} as const;

export type StructuredFoodKind = keyof typeof structuredFoodFactors;

function isTransportKind(kind: string): kind is StructuredTransportKind {
  return kind in structuredTransportFactors;
}

function isFoodKind(kind: string): kind is StructuredFoodKind {
  return kind in structuredFoodFactors;
}

/**
 * Map one parsed structured activity to a line item (kg CO₂e). Returns null if kind is unknown.
 */
export function structuredActivityToFootprintLine(act: StructuredActivity): {
  label: string;
  kg: number;
} | null {
  if (act.category === "energy" && act.kind === gridElectricityFactor.id) {
    const kg = act.quantity * gridElectricityFactor.kgCo2ePerKwh;
    return {
      label: `${gridElectricityFactor.displayName}: ${act.quantity} ${act.unit} × ${gridElectricityFactor.kgCo2ePerKwh} kg CO₂e/kWh`,
      kg,
    };
  }

  if (act.category === "transport" && isTransportKind(act.kind)) {
    const spec = structuredTransportFactors[act.kind];
    const { kgCo2ePerUnit, unitName, displayName } = spec;
    const kg = kgCo2ePerUnit * act.quantity;
    const countLabel = act.kind === "flight_legs" ? "leg" : act.unit;
    return {
      label: `${displayName} × ${act.quantity} ${countLabel} (${kgCo2ePerUnit} kg CO₂e/${unitName})`,
      kg,
    };
  }

  if (act.category === "food" && isFoodKind(act.kind)) {
    const spec = structuredFoodFactors[act.kind];
    const kg = spec.kgCo2ePerMeal * act.quantity;
    return {
      label: `${spec.displayName} × ${act.quantity} ${act.unit} (${spec.kgCo2ePerMeal} kg CO₂e/meal)`,
      kg,
    };
  }

  return null;
}

/**
 * Sum line items into total kg CO₂e (floored at zero for display consistency).
 */
export function totalKgCo2eFromLines(lines: readonly { kg: number }[]): number {
  return Math.max(0, lines.reduce((sum, l) => sum + l.kg, 0));
}
