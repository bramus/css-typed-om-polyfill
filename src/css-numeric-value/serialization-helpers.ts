import { CSSNumericValue } from './css-numeric-value';
import { CSSUnitValue } from './css-unit-value';
import { type CSSNumericType } from './css-numeric-value';
import { ABSOLUTE_UNITS } from '../units';

const canonicalUnits: Record<string, string> = {
  length: 'px',
  angle: 'deg',
  time: 's',
  frequency: 'hz',
  resolution: 'dppx'
};

export function toCanonical(val: CSSNumericValue): CSSNumericValue {
  if (val instanceof CSSUnitValue && ABSOLUTE_UNITS.has(val.unit)) {
    const type = val.type();
    for (const [dim, canonical] of Object.entries(canonicalUnits)) {
      if (type[dim as keyof CSSNumericType] === 1) {
        try {
          return val.to(canonical);
        } catch (e) {
          return val;
        }
      }
    }
  }
  return val;
}

export function compareTerms(a: CSSNumericValue, b: CSSNumericValue): number {
  const getOrder = (val: CSSNumericValue) => {
    const t = val.type();
    // Check if it is a number (dimensionless)
    const isNumber = Object.keys(t).every(k => {
      if (k === 'percentHint') return t[k] === undefined;
      return t[k as keyof CSSNumericType] === 0;
    });
    if (isNumber) return 1;
    
    // Check if it is a percentage
    if (t.percent === 1) return 2;
    
    // Otherwise it is a dimension
    return 3;
  };
  
  const orderA = getOrder(a);
  const orderB = getOrder(b);
  if (orderA !== orderB) return orderA - orderB;
  
  if (a instanceof CSSUnitValue && b instanceof CSSUnitValue) {
    if (orderA === 3) {
      return a.unit.localeCompare(b.unit);
    }
  }
  return 0;
}
