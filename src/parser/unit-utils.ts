import { CSSUnitValue } from '../css-numeric-value';
import { unitGroups, type UnitGroup } from '../units';
export type { UnitGroup };

export type UnitMap = Record<string, number>;

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
