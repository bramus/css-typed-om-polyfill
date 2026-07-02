import unitsData from './data/Units.json';

// All supported units with their official case (used for CSS.* factory functions)
const typedUnitsData = unitsData as Record<string, Record<string, {
  "is-canonical-unit"?: boolean;
  "number-of-canonical-unit"?: number;
  "relative-to"?: string;
}>>;

const allUnitsFromJSON: string[] = [];
for (const group of Object.values(typedUnitsData)) {
  for (const unit of Object.keys(group)) {
    allUnitsFromJSON.push(unit);
  }
}

export const FACTORY_UNITS = [
  "number", "percent",
  ...allUnitsFromJSON
];

export interface UnitGroup {
  units: Set<string>;
  compatible?: boolean;
  canonicalUnit?: string;
  ratios?: Record<string, number>;
}

// Unit groups with lowercase units for internal consistency
export const unitGroups: {
  fontRelativeLengths: UnitGroup;
  viewportRelativeLengths: UnitGroup;
  absoluteLengths: UnitGroup;
  angle: UnitGroup;
  time: UnitGroup;
  frequency: UnitGroup;
  resolution: UnitGroup;
  [key: string]: UnitGroup;
} = {
  fontRelativeLengths: { units: new Set() },
  viewportRelativeLengths: { units: new Set() },
  absoluteLengths: { units: new Set() },
  angle: { units: new Set() },
  time: { units: new Set() },
  frequency: { units: new Set() },
  resolution: { units: new Set() },
};

const fontRelativeLengths: string[] = [];
const viewportRelativeLengths: string[] = [];

for (const [groupName, units] of Object.entries(typedUnitsData)) {
  if (groupName === 'length') {
    const absoluteUnits: string[] = [];
    const absoluteRatios: Record<string, number> = {};
    let absoluteCanonical = 'px';

    for (const [unit, details] of Object.entries(units)) {
      const unitLower = unit.toLowerCase();
      if (details.hasOwnProperty('relative-to')) {
        if (details['relative-to'] === 'font') {
          fontRelativeLengths.push(unitLower);
        } else if (details['relative-to'] === 'viewport' || details['relative-to'] === 'container') {
          viewportRelativeLengths.push(unitLower);
        }
      } else {
        // Absolute length
        absoluteUnits.push(unitLower);
        if (details['is-canonical-unit']) {
          absoluteCanonical = unitLower;
          absoluteRatios[unitLower] = 1;
        } else if (details['number-of-canonical-unit'] !== undefined) {
          absoluteRatios[unitLower] = details['number-of-canonical-unit'];
        }
      }
    }

    unitGroups.fontRelativeLengths = { units: new Set(fontRelativeLengths) };
    unitGroups.viewportRelativeLengths = { units: new Set(viewportRelativeLengths) };
    unitGroups.absoluteLengths = {
      units: new Set(absoluteUnits),
      compatible: true,
      canonicalUnit: absoluteCanonical,
      ratios: absoluteRatios
    };
  } else if (groupName !== 'flex') { // Keep flex out of unitGroups to match original behavior if needed, or we can include it. Original didn't have it.
    const groupUnits: string[] = [];
    const ratios: Record<string, number> = {};
    let canonicalUnit = '';
    let hasRatios = false;

    for (const [unit, details] of Object.entries(units)) {
      const unitLower = unit.toLowerCase();
      groupUnits.push(unitLower);
      if (details['is-canonical-unit']) {
        canonicalUnit = unitLower;
        ratios[unitLower] = 1;
        hasRatios = true;
      } else if (details['number-of-canonical-unit'] !== undefined) {
        ratios[unitLower] = details['number-of-canonical-unit'];
        hasRatios = true;
      }
    }

    unitGroups[groupName] = {
      units: new Set(groupUnits),
      compatible: true,
      ...(hasRatios ? { canonicalUnit, ratios } : {})
    };
  }
}

// Derived sets for quick lookup (all lowercase)
export const LENGTH_UNITS = new Set([
  ...unitGroups['fontRelativeLengths']!.units,
  ...unitGroups['viewportRelativeLengths']!.units,
  ...unitGroups['absoluteLengths']!.units
]);

export const ANGLE_UNITS = unitGroups['angle']!.units;
export const TIME_UNITS = unitGroups['time']!.units;
export const FREQUENCY_UNITS = unitGroups['frequency']!.units;
export const RESOLUTION_UNITS = unitGroups['resolution']!.units;

export const ABSOLUTE_UNITS = new Set([
  ...unitGroups['absoluteLengths']!.units,
  ...unitGroups['angle']!.units,
  ...unitGroups['time']!.units,
  ...unitGroups['frequency']!.units,
  ...unitGroups['resolution']!.units
]);
