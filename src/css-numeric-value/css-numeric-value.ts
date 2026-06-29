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
    const rectifiedValues = values.map(toNumericValue);
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathSumClass || (this as any).operator === 'sum') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    if (allValues.every(v => v instanceof CSSUnitValueClass)) {
      const units = allValues.map(v => (v as any).unit);
      const firstUnit = units[0];
      if (units.every(u => u === firstUnit)) {
        const sum = allValues.reduce((acc, v) => acc + (v as any).value, 0);
        return new CSSUnitValueClass(sum, firstUnit);
      }
    }

    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for addition');
      }
      currentType = addedType;
    }

    return new CSSMathSumClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-sub
  sub(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    const rectified = values.map(toNumericValue);
    const negated = mapNegate(rectified);
    return this.add(...negated);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-mul
  mul(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    const rectifiedValues = values.map(toNumericValue);
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathProductClass || (this as any).operator === 'product') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    if (allValues.every(v => v instanceof CSSUnitValueClass && (v as any).unit === 'number')) {
      const product = allValues.reduce((acc, v) => acc * (v as any).value, 1);
      return new CSSUnitValueClass(product, 'number');
    }

    const nonNumberValues = allValues.filter(v => !(v instanceof CSSUnitValueClass && (v as any).unit === 'number'));
    if (nonNumberValues.length === 1 && allValues.every(v => v instanceof CSSUnitValueClass)) {
      const unit = (nonNumberValues[0] as any).unit;
      const product = allValues.reduce((acc, v) => acc * (v as any).value, 1);
      return new CSSUnitValueClass(product, unit);
    }

    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const multipliedType = multiplyTypes(currentType, nextType);
      if (!multipliedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for multiplication');
      }
      currentType = multipliedType;
    }

    return new CSSMathProductClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-div
  div(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    const rectified = values.map(toNumericValue);
    const inverted = mapInvert(rectified);
    return this.mul(...inverted);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-min
  min(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    const rectifiedValues = values.map(toNumericValue);
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathMinClass || (this as any).operator === 'min') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    if (allValues.every(v => v instanceof CSSUnitValueClass)) {
      const units = allValues.map(v => (v as any).unit);
      const firstUnit = units[0];
      if (units.every(u => u === firstUnit)) {
        const minVal = Math.min(...allValues.map(v => (v as any).value));
        return new CSSUnitValueClass(minVal, firstUnit);
      }
    }

    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for min');
      }
      currentType = addedType;
    }

    return new CSSMathMinClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-max
  max(...values: CSSNumberish[]): CSSNumericValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    const rectifiedValues = values.map(toNumericValue);
    const allValues: CSSNumericValue[] = [];
    if (this instanceof CSSMathMaxClass || (this as any).operator === 'max') {
      allValues.push(...(this as any).values);
    } else {
      allValues.push(this);
    }
    allValues.push(...rectifiedValues);

    if (allValues.every(v => v instanceof CSSUnitValueClass)) {
      const units = allValues.map(v => (v as any).unit);
      const firstUnit = units[0];
      if (units.every(u => u === firstUnit)) {
        const maxVal = Math.max(...allValues.map(v => (v as any).value));
        return new CSSUnitValueClass(maxVal, firstUnit);
      }
    }

    let currentType = allValues[0]!.type();
    for (let i = 1; i < allValues.length; i++) {
      const nextType = allValues[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for max');
      }
      currentType = addedType;
    }

    return new CSSMathMaxClass(...allValues);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-equals
  equals(...values: CSSNumberish[]): boolean {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    const numerics = values.map(toNumericValue);
    for (const val of numerics) {
      if (!equalNumericValue(this, val)) {
        return false;
      }
    }
    return true;
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-to
  to(unit: string): CSSUnitValue {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
    return to(this, unit);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-tosum
  toSum(...units: string[]): CSSMathSum {
    if (!(this instanceof CSSNumericValue)) {
      throw new TypeError("Value of 'this' is not a CSSNumericValue");
    }
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
    return cleanType(finalType);
  }
  
  const hasPercent1 = (type1.percent || 0) !== 0;
  const hasPercent2 = (type2.percent || 0) !== 0;
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
        return cleanType(finalType);
      }
    }
  }
  
  return null;
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssnumericvalue-multiply-two-types
export function multiplyTypes(t1: CSSNumericType, t2: CSSNumericType): CSSNumericType | null {
  const result = createEmptyType();
  const keys: Exclude<keyof CSSNumericType, 'percentHint'>[] = ['length', 'angle', 'time', 'frequency', 'resolution', 'flex', 'percent'];
  for (const k of keys) {
    result[k] = (t1[k] || 0) + (t2[k] || 0);
  }
  if (t1.percentHint && t2.percentHint && t1.percentHint !== t2.percentHint) {
    return null;
  }
  result.percentHint = t1.percentHint || t2.percentHint;
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

