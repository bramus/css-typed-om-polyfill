import { CSSUnitValue } from '../css-numeric-value';

export type UnitMap = Record<string, number>;

export interface UnitGroup {
  units: Set<string>;
  compatible?: boolean;
  canonicalUnit?: string;
  ratios?: Record<string, number>;
}

export const unitGroups = {
  fontRelativeLengths: {
    units: new Set(["em", "rem", "ex", "rex", "cap", "rcap", "ch", "rch", "ic", "ric", "lh", "rlh"])
  },
  viewportRelativeLengths: {
    units: new Set(
      ["vw", "lvw", "svw", "dvw", "vh", "lvh", "svh", "dvh", "vi", "lvi", "svi", "dvi", "vb", "lvb", "svb", "dvb",
        "vmin", "lvmin", "svmin", "dvmin", "vmax", "lvmax", "svmax", "dvmax"])
  },
  absoluteLengths: {
    units: new Set(["cm", "mm", "q", "in", "pt", "pc", "px"]),
    compatible: true,
    canonicalUnit: "px",
    ratios: {
      "cm": 96 / 2.54, "mm": (96 / 2.54) / 10, "q": (96 / 2.54) / 40, "in": 96, "pc": 96 / 6, "pt": 96 / 72, "px": 1
    }
  },
  angle: {
    units: new Set(["deg", "grad", "rad", "turn"]),
    compatible: true,
    canonicalUnit: "deg",
    ratios: {
      "deg": 1, "grad": 360 / 400, "rad": 180 / Math.PI, "turn": 360
    }
  },
  time: {
    units: new Set(["s", "ms"]),
    compatible: true,
    canonicalUnit: "s",
    ratios: {
      "s": 1, "ms": 1 / 1000
    }
  },
  frequency: {
    units: new Set(["hz", "khz"]),
    compatible: true,
    canonicalUnit: "hz",
    ratios: {
      "hz": 1, "khz": 1000
    }
  },
  resolution: {
    units: new Set(["dpi", "dpcm", "dppx"]),
    compatible: true,
    canonicalUnit: "dppx",
    ratios: {
      "dpi": 1 / 96, "dpcm": 2.54 / 96, "dppx": 1
    }
  }
};

const unitToCompatibleUnitsMap = new Map<string, UnitGroup>();
for (const group of Object.values(unitGroups) as UnitGroup[]) {
  if (!group.compatible) {
    continue;
  }
  for (const unit of group.units) {
    unitToCompatibleUnitsMap.set(unit, group);
  }
}

export function getSetOfCompatibleUnits(unit: string): UnitGroup | undefined {
  return unitToCompatibleUnitsMap.get(unit.toLowerCase());
}

export function convertCSSUnitValue(cssUnitValue: CSSUnitValue, unit: string): CSSUnitValue | null {
  const normalizedOld = (cssUnitValue.unit === '%' || cssUnitValue.unit === 'percent') ? 'percent' : cssUnitValue.unit.toLowerCase();
  const normalizedNew = (unit === '%' || unit === 'percent') ? 'percent' : unit.toLowerCase();

  if (normalizedOld === normalizedNew) {
    return new CSSUnitValue(cssUnitValue.value, unit);
  }
  const oldUnit = cssUnitValue.unit.toLowerCase();
  const oldValue = cssUnitValue.value;
  const oldCompatibleUnitGroup = getSetOfCompatibleUnits(oldUnit);
  const compatibleUnitGroup = getSetOfCompatibleUnits(normalizedNew);
  if (!compatibleUnitGroup || oldCompatibleUnitGroup !== compatibleUnitGroup) {
    return null;
  }
  return new CSSUnitValue(oldValue * compatibleUnitGroup.ratios![oldUnit]! / compatibleUnitGroup.ratios![normalizedNew]!, unit);
}

export function createAType(unit: string): Record<string, number> | null {
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit === "number") {
    return {};
  } else if (lowerUnit === "percent" || lowerUnit === "%") {
    return { "percent": 1 };
  } else if (unitGroups.absoluteLengths.units.has(lowerUnit) || unitGroups.fontRelativeLengths.units.has(lowerUnit) ||
    unitGroups.viewportRelativeLengths.units.has(lowerUnit)) {
    return { "length": 1 };
  } else if (unitGroups.angle.units.has(lowerUnit)) {
    return { "angle": 1 };
  } else if (unitGroups.time.units.has(lowerUnit)) {
    return { "time": 1 };
  } else if (unitGroups.frequency.units.has(lowerUnit)) {
    return { "frequency": 1 };
  } else if (unitGroups.resolution.units.has(lowerUnit)) {
    return { "resolution": 1 };
  } else if (lowerUnit === "fr") {
    return { "flex": 1 };
  } else {
    return null;
  }
}
