import { CSSStyleValue } from '../css-style-value';
import { parseCSSNumericValue, createSumValue, to, toSum } from '../parser/css-numeric-parser';
import type { CSSUnitValue } from './css-unit-value';
import type { CSSMathSum } from './css-math-sum';

export type CSSNumberish = number | CSSNumericValue;

export interface CSSNumericType {
  length: number;
  angle: number;
  time: number;
  frequency: number;
  resolution: number;
  flex: number;
  percent: number;
  percentHint?: 'length' | 'angle' | 'time' | 'frequency' | 'resolution' | 'flex' | undefined;
}

// Registry for subclasses to avoid circular dependencies
export let CSSUnitValueClass: any = null;
export let CSSMathSumClass: any = null;
export let CSSMathProductClass: any = null;
export let CSSMathNegateClass: any = null;
export let CSSMathInvertClass: any = null;
export let CSSMathMinClass: any = null;
export let CSSMathMaxClass: any = null;

export function registerNumericClasses(classes: {
  UnitValue: any;
  MathSum: any;
  MathProduct: any;
  MathNegate: any;
  MathInvert: any;
  MathMin: any;
  MathMax: any;
}) {
  CSSUnitValueClass = classes.UnitValue;
  CSSMathSumClass = classes.MathSum;
  CSSMathProductClass = classes.MathProduct;
  CSSMathNegateClass = classes.MathNegate;
  CSSMathInvertClass = classes.MathInvert;
  CSSMathMinClass = classes.MathMin;
  CSSMathMaxClass = classes.MathMax;
}

export function toNumericValue(val: CSSNumberish): CSSNumericValue {
  if (typeof val === 'number') {
    return new CSSUnitValueClass(val, 'number');
  }
  return val;
}

export abstract class CSSNumericValue extends CSSStyleValue {
  abstract type(): CSSNumericType;

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-parse
  static parse(cssText: string): CSSNumericValue {
    return parseCSSNumericValue(cssText);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-add
  add(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    // Check type compatibility
    let currentType = numerics[0]!.type();
    for (let i = 1; i < numerics.length; i++) {
      const nextType = numerics[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for addition');
      }
      currentType = addedType;
    }
    return new CSSMathSumClass(...numerics);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-sub
  sub(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = values.map(toNumericValue);
    const negated = numerics.map(val => new CSSMathNegateClass(val));
    return this.add(...negated);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-mul
  mul(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    return new CSSMathProductClass(...numerics);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-div
  div(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = values.map(toNumericValue);
    const inverted = numerics.map(val => new CSSMathInvertClass(val));
    return this.mul(...inverted);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-min
  min(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    const firstType = numerics[0]!.type();
    for (let i = 1; i < numerics.length; i++) {
      if (!typesEqual(firstType, numerics[i]!.type())) {
        throw new TypeError('CSSNumericValues are not of compatible types for min');
      }
    }
    return new CSSMathMinClass(...numerics);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-max
  max(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    const firstType = numerics[0]!.type();
    for (let i = 1; i < numerics.length; i++) {
      if (!typesEqual(firstType, numerics[i]!.type())) {
        throw new TypeError('CSSNumericValues are not of compatible types for max');
      }
    }
    return new CSSMathMaxClass(...numerics);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-equals
  equals(...values: CSSNumberish[]): boolean {
    const numerics = values.map(toNumericValue);
    const thisSum = createSumValue(this);
    if (!thisSum) return false;

    for (const val of numerics) {
      const otherSum = createSumValue(val);
      if (!otherSum || thisSum.length !== otherSum.length) return false;
      const matched = new Set<number>();
      for (const item1 of thisSum) {
        let found = false;
        for (let i = 0; i < otherSum.length; i++) {
          if (matched.has(i)) continue;
          const item2 = otherSum[i]!;
          if (item1[0] === item2[0] && unitMapsEqual(item1[1], item2[1])) {
            matched.add(i);
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
    }
    return true;
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-to
  to(unit: string): CSSUnitValue {
    return to(this, unit);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-tosum
  toSum(...units: string[]): CSSMathSum {
    return toSum(this, ...units);
  }
}

export function createEmptyType(): CSSNumericType {
  return {
    length: 0,
    angle: 0,
    time: 0,
    frequency: 0,
    resolution: 0,
    flex: 0,
    percent: 0
  };
}

export function typesEqual(t1: CSSNumericType, t2: CSSNumericType): boolean {
  return t1.length === t2.length &&
         t1.angle === t2.angle &&
         t1.time === t2.time &&
         t1.frequency === t2.frequency &&
         t1.resolution === t2.resolution &&
         t1.flex === t2.flex &&
         t1.percent === t2.percent &&
         t1.percentHint === t2.percentHint;
}

// https://drafts.css-houdini.org/css-typed-om-1/#numeric-typing
// Section 4.3.2. Numeric Value Typing
export function applyPercentHint(type: CSSNumericType, hint: string): CSSNumericType {
  const result = { ...type, percentHint: hint as any };
  if (hint !== 'percent' && result.percent !== 0) {
    const key = hint as keyof CSSNumericType;
    result[key] = ((result[key] as number) || 0) + result.percent;
    result.percent = 0;
  }
  return result;
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssnumericvalue-add-two-types
export function addTypes(t1: CSSNumericType, t2: CSSNumericType): CSSNumericType | null {
  const finalType = createEmptyType();
  
  const h1 = t1.percentHint;
  const h2 = t2.percentHint;
  
  let type1 = { ...t1 };
  let type2 = { ...t2 };
  
  if (h1 && h2 && h1 !== h2) {
    return null;
  }
  if (h1 && !h2) {
    type2 = applyPercentHint(type2, h1);
  } else if (h2 && !h1) {
    type1 = applyPercentHint(type1, h2);
  }
  
  const cleanType1 = { ...type1, percentHint: undefined };
  const cleanType2 = { ...type2, percentHint: undefined };
  
  if (typesEqual(cleanType1, cleanType2)) {
    Object.assign(finalType, type1);
    finalType.percentHint = type1.percentHint || type2.percentHint;
    return finalType;
  }
  
  const hasPercent1 = type1.percent !== 0;
  const hasPercent2 = type2.percent !== 0;
  const hasOther1 = hasOtherThanPercent(type1);
  const hasOther2 = hasOtherThanPercent(type2);
  
  if ((hasPercent1 || hasPercent2) && (hasOther1 || hasOther2)) {
    const baseTypesOtherThanPercent = ["length", "angle", "time", "frequency", "resolution", "flex"];
    for (const hint of baseTypesOtherThanPercent) {
      const provType1 = applyPercentHint({ ...type1 }, hint);
      const provType2 = applyPercentHint({ ...type2 }, hint);
      
      const cleanProv1 = { ...provType1, percentHint: undefined };
      const cleanProv2 = { ...provType2, percentHint: undefined };
      
      if (typesEqual(cleanProv1, cleanProv2)) {
        Object.assign(finalType, provType1);
        finalType.percentHint = hint as any;
        return finalType;
      }
    }
  }
  
  return null;
}

function hasOtherThanPercent(type: CSSNumericType): boolean {
  return type.length !== 0 ||
         type.angle !== 0 ||
         type.time !== 0 ||
         type.frequency !== 0 ||
         type.resolution !== 0 ||
         type.flex !== 0;
}

export function matchesLength(type: CSSNumericType): boolean {
  return type.length === 1 &&
         type.angle === 0 &&
         type.time === 0 &&
         type.frequency === 0 &&
         type.resolution === 0 &&
         type.flex === 0 &&
         type.percent === 0 &&
         (type.percentHint === null || type.percentHint === undefined || type.percentHint === 'length');
}

export function matchesPercentage(type: CSSNumericType): boolean {
  return type.percent === 1 &&
         type.length === 0 &&
         type.angle === 0 &&
         type.time === 0 &&
         type.frequency === 0 &&
         type.resolution === 0 &&
         type.flex === 0 &&
         (type.percentHint === null || type.percentHint === undefined);
}

export function matchesLengthPercentage(type: CSSNumericType): boolean {
  return matchesLength(type) || matchesPercentage(type);
}

export function matchesAngle(type: CSSNumericType): boolean {
  return type.angle === 1 &&
         type.length === 0 &&
         type.time === 0 &&
         type.frequency === 0 &&
         type.resolution === 0 &&
         type.flex === 0 &&
         type.percent === 0 &&
         (type.percentHint === null || type.percentHint === undefined || type.percentHint === 'angle');
}

export function matchesAnglePercentage(type: CSSNumericType): boolean {
  return matchesAngle(type) || matchesPercentage(type);
}

function unitMapsEqual(m1: Record<string, number>, m2: Record<string, number>): boolean {
  const keys1 = Object.keys(m1);
  const keys2 = Object.keys(m2);
  if (keys1.length !== keys2.length) return false;
  for (const k of keys1) {
    if (m1[k] !== m2[k]) return false;
  }
  return true;
}
