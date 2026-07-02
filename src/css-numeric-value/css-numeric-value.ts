import { CSSStyleValue } from '../css-style-value';
import { parseCSSNumericValue, createSumValue, to, toSum } from '../parser/css-numeric-parser';
import { simplifyCalculation } from '../parser/simplify-calculation';
import type { CSSUnitValue } from './css-unit-value';
import type { CSSMathSum } from './css-math-sum';
import type { CSSMathValue } from './css-math-value';
import type { CSSMathNegate } from './css-math-negate';
import type { CSSMathInvert } from './css-math-invert';
import type { CSSMathClamp } from './css-math-clamp';

export type CSSNumberish = number | CSSNumericValue;

export interface CSSNumericType {
  length?: number;
  angle?: number;
  time?: number;
  frequency?: number;
  resolution?: number;
  flex?: number;
  percent?: number;
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
export let CSSMathClampClass: any = null;

export function registerNumericClasses(classes: {
  UnitValue: any;
  MathSum: any;
  MathProduct: any;
  MathNegate: any;
  MathInvert: any;
  MathMin: any;
  MathMax: any;
  MathClamp: any;
}) {
  CSSUnitValueClass = classes.UnitValue;
  CSSMathSumClass = classes.MathSum;
  CSSMathProductClass = classes.MathProduct;
  CSSMathNegateClass = classes.MathNegate;
  CSSMathInvertClass = classes.MathInvert;
  CSSMathMinClass = classes.MathMin;
  CSSMathMaxClass = classes.MathMax;
  CSSMathClampClass = classes.MathClamp;
}

export function toNumericValue(val: CSSNumberish): CSSNumericValue {
  if (typeof val === 'number') {
    return new CSSUnitValueClass(val, 'number');
  }
  return val;
}

function equalNumericValue(v1: CSSNumericValue, v2: CSSNumericValue): boolean {
  if (v1.constructor !== v2.constructor) {
    return false;
  }
  if (v1 instanceof CSSUnitValueClass && v2 instanceof CSSUnitValueClass) {
    const u1 = v1 as unknown as CSSUnitValue;
    const u2 = v2 as unknown as CSSUnitValue;
    return u1.value === u2.value && u1.unit === u2.unit;
  }
  if (v1 instanceof CSSMathSumClass || v1 instanceof CSSMathProductClass || v1 instanceof CSSMathMinClass || v1 instanceof CSSMathMaxClass) {
    const m1 = v1 as unknown as CSSMathSum;
    const m2 = v2 as unknown as CSSMathSum;
    const values1 = m1.values;
    const values2 = m2.values;
    if (values1.length !== values2.length) {
      return false;
    }
    for (let i = 0; i < values1.length; i++) {
      if (!equalNumericValue(values1[i]!, values2[i]!)) {
        return false;
      }
    }
    return true;
  }
  if (v1 instanceof CSSMathNegateClass && v2 instanceof CSSMathNegateClass) {
    return equalNumericValue((v1 as unknown as CSSMathNegate).value, (v2 as unknown as CSSMathNegate).value);
  }
  if (v1 instanceof CSSMathInvertClass && v2 instanceof CSSMathInvertClass) {
    return equalNumericValue((v1 as unknown as CSSMathInvert).value, (v2 as unknown as CSSMathInvert).value);
  }
  if (v1 instanceof CSSMathClampClass && v2 instanceof CSSMathClampClass) {
    const c1 = v1 as unknown as CSSMathClamp;
    const c2 = v2 as unknown as CSSMathClamp;
    return equalNumericValue(c1.value, c2.value) &&
           equalNumericValue(c1.lower, c2.lower) &&
           equalNumericValue(c1.upper, c2.upper);
  }
  return false;
}

export abstract class CSSNumericValue extends CSSStyleValue {
  constructor() {
    super();
    if (this.constructor === CSSNumericValue) {
      throw new TypeError('CSSNumericValue cannot be directly constructed');
    }
  }

  abstract _serialize(nested: boolean, parenLess: boolean, minimum?: CSSNumericValue, maximum?: CSSNumericValue): string;

  toString(): string {
    return this._serialize(false, false);
  }

  type(): CSSNumericType {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    throw new TypeError('Abstract method');
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-parse
  static parse(cssText: string): CSSNumericValue {
    if (this instanceof CSSStyleValue && arguments.length < 2) {
      throw new TypeError(`Failed to execute 'parse' on 'CSSStyleValue': 2 arguments required, but only ${arguments.length} present.`);
    }
    if (arguments.length < 1) {
      throw new TypeError(`Failed to execute 'parse' on 'CSSNumericValue': 1 argument required, but only ${arguments.length} present.`);
    }
    return parseCSSNumericValue(cssText);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-add
  add(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // 1. Let rectified be a list of CSSNumericValueS, initially empty.
    // 2. For each val in values:
    //    1. If val is a double, append new CSSUnitValue(val, "number") to rectified.
    //    2. Otherwise (if val is a CSSNumericValue), append val to rectified.
    const rectifiedValues = values.map(toNumericValue);

    // 3. Let sum be a new CSSMathSum whose values are this and the items in rectified.
    // @NOTE: Deviating from spec to eagerly flatten Sum values and simplify if possible.
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathSumClass || (this as any).operator === 'sum') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    // @NOTE: Deviating from spec to eagerly simplify sum of same-unit CSSUnitValues.
    if (allValues.every(v => v instanceof CSSUnitValueClass)) {
      const units = allValues.map(v => (v as any).unit);
      const firstUnit = units[0];
      if (units.every(u => u === firstUnit)) {
        const sum = allValues.reduce((acc, v) => acc + (v as any).value, 0);
        return new CSSUnitValueClass(sum, firstUnit);
      }
    }

    // 4. If sum is invalid (as determined by the CSSMathSum constructor), throw a TypeError.
    // @NOTE: Performing type check inline before construction.
    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for addition');
      }
      currentType = addedType;
    }

    // 5. Return sum, simplified.
    // @NOTE: Returning CSSMathSum, assuming it is as simplified as possible at this point.
    return new CSSMathSumClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-sub
  sub(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // 1. Let rectified be a list of CSSNumericValueS, initially empty.
    // 2. For each val in values:
    //    1. If val is a double, append new CSSUnitValue(val, "number") to rectified.
    //    2. Otherwise (if val is a CSSNumericValue), append val to rectified.
    const rectified = values.map(toNumericValue);
    // 3. Let negated be a list of CSSNumericValueS, initially empty.
    // 4. For each val in rectified:
    //    1. Let neg be new CSSMathNegate(val).
    //    2. Append neg, simplified, to negated.
    // @NOTE: mapNegate performs the simplification (e.g. double negation, negating UnitValue).
    const negated = mapNegate(rectified);
    // 5. Let sum be this.add(...negated).
    // 6. Return sum.
    return this.add(...negated);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-mul
  mul(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // 1. Let rectified be a list of CSSNumericValueS, initially empty.
    // 2. For each val in values:
    //    1. If val is a double, append new CSSUnitValue(val, "number") to rectified.
    //    2. Otherwise (if val is a CSSNumericValue), append val to rectified.
    const rectifiedValues = values.map(toNumericValue);

    // 3. Let product be a new CSSMathProduct whose values are this and the items in rectified.
    // @NOTE: Deviating from spec to eagerly flatten Product values and simplify if possible.
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathProductClass || (this as any).operator === 'product') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    // @NOTE: Deviating from spec to eagerly simplify product of numbers.
    if (allValues.every(v => v instanceof CSSUnitValueClass && (v as any).unit === 'number')) {
      const product = allValues.reduce((acc, v) => acc * (v as any).value, 1);
      return new CSSUnitValueClass(product, 'number');
    }

    // @NOTE: Deviating from spec to eagerly simplify product of one dimension and numbers.
    const nonNumberValues = allValues.filter(v => !(v instanceof CSSUnitValueClass && (v as any).unit === 'number'));
    if (nonNumberValues.length === 1 && allValues.every(v => v instanceof CSSUnitValueClass)) {
      const unit = (nonNumberValues[0] as any).unit;
      const product = allValues.reduce((acc, v) => acc * (v as any).value, 1);
      return new CSSUnitValueClass(product, unit);
    }

    // 4. If product is invalid (as determined by the CSSMathProduct constructor), throw a TypeError.
    // @NOTE: Performing type check inline before construction.
    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const multipliedType = multiplyTypes(currentType, nextType);
      if (!multipliedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for multiplication');
      }
      currentType = multipliedType;
    }

    // 5. Return product, simplified.
    // @NOTE: Returning CSSMathProduct, assuming it is as simplified as possible at this point.
    return new CSSMathProductClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-div
  div(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // 1. Let rectified be a list of CSSNumericValueS, initially empty.
    // 2. For each val in values:
    //    1. If val is a double, append new CSSUnitValue(val, "number") to rectified.
    //    2. Otherwise (if val is a CSSNumericValue), append val to rectified.
    const rectified = values.map(toNumericValue);
    // 3. Let inverted be a list of CSSNumericValueS, initially empty.
    // 4. For each val in rectified:
    //    1. Let inv be new CSSMathInvert(val).
    //    2. Append inv, simplified, to inverted.
    // @NOTE: mapInvert performs the simplification (e.g. double inversion, inverting numbers).
    const inverted = mapInvert(rectified);
    // 5. Let product be this.mul(...inverted).
    // 6. Return product.
    return this.mul(...inverted);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-min
  min(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // 1. Let rectified be a list of CSSNumericValueS, initially empty.
    // 2. For each val in values:
    //    1. If val is a double, append new CSSUnitValue(val, "number") to rectified.
    //    2. Otherwise (if val is a CSSNumericValue), append val to rectified.
    const rectifiedValues = values.map(toNumericValue);

    // 3. Let min be a new CSSMathMin whose values are this and the items in rectified.
    // @NOTE: Deviating from spec to eagerly flatten Min values and simplify if possible.
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathMinClass || (this as any).operator === 'min') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    // @NOTE: Deviating from spec to eagerly simplify min of same-unit CSSUnitValues.
    if (allValues.every(v => v instanceof CSSUnitValueClass)) {
      const units = allValues.map(v => (v as any).unit);
      const firstUnit = units[0];
      if (units.every(u => u === firstUnit)) {
        const minVal = Math.min(...allValues.map(v => (v as any).value));
        return new CSSUnitValueClass(minVal, firstUnit);
      }
    }

    // 4. If min is invalid (as determined by the CSSMathMin constructor), throw a TypeError.
    // @NOTE: Performing type check inline before construction.
    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for min');
      }
      currentType = addedType;
    }

    // 5. Return min, simplified.
    // @NOTE: Returning CSSMathMin, assuming it is as simplified as possible at this point.
    return new CSSMathMinClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-max
  max(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // 1. Let rectified be a list of CSSNumericValueS, initially empty.
    // 2. For each val in values:
    //    1. If val is a double, append new CSSUnitValue(val, "number") to rectified.
    //    2. Otherwise (if val is a CSSNumericValue), append val to rectified.
    const rectifiedValues = values.map(toNumericValue);

    // 3. Let max be a new CSSMathMax whose values are this and the items in rectified.
    // @NOTE: Deviating from spec to eagerly flatten Max values and simplify if possible.
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathMaxClass || (this as any).operator === 'max') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    // @NOTE: Deviating from spec to eagerly simplify max of same-unit CSSUnitValues.
    if (allValues.every(v => v instanceof CSSUnitValueClass)) {
      const units = allValues.map(v => (v as any).unit);
      const firstUnit = units[0];
      if (units.every(u => u === firstUnit)) {
        const maxVal = Math.max(...allValues.map(v => (v as any).value));
        return new CSSUnitValueClass(maxVal, firstUnit);
      }
    }

    // 4. If max is invalid (as determined by the CSSMathMax constructor), throw a TypeError.
    // @NOTE: Performing type check inline before construction.
    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for max');
      }
      currentType = addedType;
    }

    // 5. Return max, simplified.
    // @NOTE: Returning CSSMathMax, assuming it is as simplified as possible at this point.
    return new CSSMathMaxClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-equals
  equals(...values: CSSNumberish[]): boolean {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // 1. Let values be the items in values.
    // 2. Let rectified be a list of CSSNumericValueS, initially empty.
    // 3. For each val in values:
    //    1. If val is a double, append new CSSUnitValue(val, "number") to rectified.
    //    2. Otherwise (if val is a CSSNumericValue), append val to rectified.
    const numerics = values.map(toNumericValue);
    // 4. If rectified is empty, return true.
    // @NOTE: The loop below naturally handles empty rectified by not executing and returning true.
    // 5. For each val in rectified:
    //    1. If this and val are not the same CSSNumericValue, return false.
    for (const val of numerics) {
      if (!equalNumericValue(this, val)) {
        return false;
      }
    }
    // 6. Return true.
    return true;
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-to
  to(unit: string): CSSUnitValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // @NOTE: Delegating to helper function which implements the spec algorithm:
    // 1. Let sum be this, converted to a sum of member units.
    // 2. If sum is null, throw a TypeError.
    // 3. If sum has more than one value, throw a TypeError.
    // 4. Let val be the single value in sum.
    // 5. If val's unit is not unit, throw a TypeError.
    // 6. Return val.
    return to(this, unit);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-tosum
  toSum(...units: string[]): CSSMathSum {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    // @NOTE: Delegating to helper function which implements the spec algorithm:
    // 1. Let sum be this, converted to a sum of member units.
    // 2. If sum is null, throw a TypeError.
    // 3. If units is empty:
    //    1. Sort sum's values by their unit, lexicographically.
    //    2. Return sum.
    // 4. If units contains any duplicate values, throw a TypeError.
    // 5. If any member of units is not a valid CSS unit, throw a SyntaxError.
    // ...
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

export function cleanType(type: CSSNumericType): CSSNumericType {
  const result: any = {};
  const keys: (keyof CSSNumericType)[] = ['length', 'angle', 'time', 'frequency', 'resolution', 'flex', 'percent'];
  for (const k of keys) {
    if (type[k] !== 0 && type[k] !== undefined) {
      result[k] = type[k];
    }
  }
  if (type.percentHint !== undefined) {
    result.percentHint = type.percentHint;
  }
  return result as CSSNumericType;
}

export function typesEqual(t1: CSSNumericType, t2: CSSNumericType): boolean {
  const keys: (keyof CSSNumericType)[] = ['length', 'angle', 'time', 'frequency', 'resolution', 'flex', 'percent'];
  for (const k of keys) {
    if ((t1[k] || 0) !== (t2[k] || 0)) return false;
  }
  return t1.percentHint === t2.percentHint;
}

// https://drafts.css-houdini.org/css-typed-om-1/#numeric-typing
// Section 4.3.2. Numeric Value Typing
export function applyPercentHint(type: CSSNumericType, hint: string): CSSNumericType {
  const result = { ...type, percentHint: hint as any };
  const percent = result.percent || 0;
  if (hint !== 'percent' && percent !== 0) {
    const key = hint as keyof CSSNumericType;
    result[key] = ((result[key] as number) || 0) + percent;
    result.percent = 0;
  }
  return result;
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssnumericvalue-add-two-types
export function addTypes(t1: CSSNumericType, t2: CSSNumericType): CSSNumericType | null {
  // 1. Let t1 and t2 be the two CSSNumericTypes.
  // 2. Let finalType be a new CSSNumericType, initially empty.
  const finalType = createEmptyType();
  
  const h1 = t1.percentHint;
  const h2 = t2.percentHint;
  
  let type1 = { ...t1 };
  let type2 = { ...t2 };
  
  // 3. If both t1 and t2 have a percent hint, and they are different, return failure.
  if (h1 && h2 && h1 !== h2) {
    return null;
  }
  // 4. If t1 has a percent hint, apply the percent hint to t2.
  if (h1 && !h2) {
    type2 = applyPercentHint(type2, h1);
  }
  // 5. If t2 has a percent hint, apply the percent hint to t1.
  else if (h2 && !h1) {
    type1 = applyPercentHint(type1, h2);
  }
  
  const cleanType1 = { ...type1, percentHint: undefined };
  const cleanType2 = { ...type2, percentHint: undefined };
  
  // 6. If t1 and t2 have the same type, set finalType to that type.
  if (typesEqual(cleanType1, cleanType2)) {
    Object.assign(finalType, type1);
    finalType.percentHint = type1.percentHint || type2.percentHint;
    return cleanType(finalType);
  }
  
  const hasPercent1 = (type1.percent || 0) !== 0;
  const hasPercent2 = (type2.percent || 0) !== 0;
  const hasOther1 = hasOtherThanPercent(type1);
  const hasOther2 = hasOtherThanPercent(type2);
  
  // 7. If one of t1 or t2 contains a non-zero percent, and the other contains at least one non-zero entry other than percent:
  if ((hasPercent1 || hasPercent2) && (hasOther1 || hasOther2)) {
    //    1. For each base type other than percent:
    const baseTypesOtherThanPercent = ["length", "angle", "time", "frequency", "resolution", "flex"];
    for (const hint of baseTypesOtherThanPercent) {
      //       1. Apply a percent hint of that base type to both t1 and t2.
      const provType1 = applyPercentHint({ ...type1 }, hint);
      const provType2 = applyPercentHint({ ...type2 }, hint);
      
      const cleanProv1 = { ...provType1, percentHint: undefined };
      const cleanProv2 = { ...provType2, percentHint: undefined };
      
      //       2. If the resulting types are the same, return the type, with a percent hint of that base type.
      if (typesEqual(cleanProv1, cleanProv2)) {
        Object.assign(finalType, provType1);
        finalType.percentHint = hint as any;
        return cleanType(finalType);
      }
    }
  }
  
  // 8. Return failure.
  return null;
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssnumericvalue-multiply-two-types
export function multiplyTypes(t1: CSSNumericType, t2: CSSNumericType): CSSNumericType | null {
  // 1. Let t1 and t2 be the two CSSNumericTypes.
  // 2. Let result be a new CSSNumericType, initially empty.
  const result = createEmptyType();
  // 3. For each base type in t1 and t2, set result's entry for that base type to the sum of the entries in t1 and t2.
  const keys: Exclude<keyof CSSNumericType, 'percentHint'>[] = ['length', 'angle', 'time', 'frequency', 'resolution', 'flex', 'percent'];
  for (const k of keys) {
    result[k] = (t1[k] || 0) + (t2[k] || 0);
  }
  // 4. If both t1 and t2 have a percent hint, and they are different, return failure.
  if (t1.percentHint && t2.percentHint && t1.percentHint !== t2.percentHint) {
    return null;
  }
  // 5. Set result's percent hint to the percent hint of t1 or t2.
  result.percentHint = t1.percentHint || t2.percentHint;
  // 6. Return result.
  return cleanType(result);
}

function hasOtherThanPercent(type: CSSNumericType): boolean {
  return (type.length || 0) !== 0 ||
         (type.angle || 0) !== 0 ||
         (type.time || 0) !== 0 ||
         (type.frequency || 0) !== 0 ||
         (type.resolution || 0) !== 0 ||
         (type.flex || 0) !== 0;
}

export function matchesLength(type: CSSNumericType): boolean {
  return (type.length || 0) === 1 &&
         (type.angle || 0) === 0 &&
         (type.time || 0) === 0 &&
         (type.frequency || 0) === 0 &&
         (type.resolution || 0) === 0 &&
         (type.flex || 0) === 0 &&
         (type.percent || 0) === 0 &&
         (type.percentHint === null || type.percentHint === undefined || type.percentHint === 'length');
}

export function matchesPercentage(type: CSSNumericType): boolean {
  return (type.percent || 0) === 1 &&
         (type.length || 0) === 0 &&
         (type.angle || 0) === 0 &&
         (type.time || 0) === 0 &&
         (type.frequency || 0) === 0 &&
         (type.resolution || 0) === 0 &&
         (type.flex || 0) === 0 &&
         (type.percentHint === null || type.percentHint === undefined);
}

export function matchesLengthPercentage(type: CSSNumericType): boolean {
  return matchesLength(type) || matchesPercentage(type);
}

export function matchesAngle(type: CSSNumericType): boolean {
  return (type.angle || 0) === 1 &&
         (type.length || 0) === 0 &&
         (type.time || 0) === 0 &&
         (type.frequency || 0) === 0 &&
         (type.resolution || 0) === 0 &&
         (type.flex || 0) === 0 &&
         (type.percent || 0) === 0 &&
         (type.percentHint === null || type.percentHint === undefined || type.percentHint === 'angle');
}

export function matchesAnglePercentage(type: CSSNumericType): boolean {
  return matchesAngle(type) || matchesPercentage(type);
}

export function matchesNumber(type: CSSNumericType): boolean {
  return (type.length || 0) === 0 &&
         (type.angle || 0) === 0 &&
         (type.time || 0) === 0 &&
         (type.frequency || 0) === 0 &&
         (type.resolution || 0) === 0 &&
         (type.flex || 0) === 0 &&
         (type.percent || 0) === 0;
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

function mapNegate(values: CSSNumericValue[]): CSSNumericValue[] {
  return values.map(val => {
    if (val instanceof CSSUnitValueClass) {
      const u = val as unknown as CSSUnitValue;
      return new CSSUnitValueClass(-u.value, u.unit);
    }
    if (val instanceof CSSMathNegateClass) {
      return (val as unknown as CSSMathNegate).value;
    }
    return new CSSMathNegateClass(val);
  });
}

function mapInvert(values: CSSNumericValue[]): CSSNumericValue[] {
  return values.map(val => {
    if (val instanceof CSSUnitValueClass) {
      const u = val as unknown as CSSUnitValue;
      if (u.unit === 'number') {
        if (u.value === 0) {
          throw new RangeError('Division by zero');
        }
        return new CSSUnitValueClass(1 / u.value, 'number');
      }
      return new CSSMathInvertClass(val);
    }
    if (val instanceof CSSMathInvertClass) {
      return (val as unknown as CSSMathInvert).value;
    }
    return new CSSMathInvertClass(val);
  });
}

