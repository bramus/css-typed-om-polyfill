import { CSSStyleValue } from './css-style-value';
import { parseCSSNumericValue, createAType, getSetOfCompatibleUnits, createSumValue, to, toSum } from './parser/css-numeric-parser';
import { simplifyCalculation } from './parser/simplify-calculation';

export type CSSNumberish = number | CSSNumericValue;

export interface CSSNumericType {
  length: number;
  angle: number;
  time: number;
  frequency: number;
  resolution: number;
  flex: number;
  percent: number;
  percentHint?: 'length' | 'angle' | 'time' | 'frequency' | 'resolution' | 'flex';
}

export function toNumericValue(val: CSSNumberish): CSSNumericValue {
  if (typeof val === 'number') {
    return new CSSUnitValue(val, 'number');
  }
  return val;
}

export abstract class CSSNumericValue extends CSSStyleValue {
  abstract type(): CSSNumericType;

  static parse(cssText: string): CSSNumericValue {
    return parseCSSNumericValue(cssText);
  }

  add(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    // Check type compatibility
    const firstType = numerics[0]!.type();
    for (let i = 1; i < numerics.length; i++) {
      if (!typesEqual(firstType, numerics[i]!.type())) {
        throw new TypeError('CSSNumericValues are not of compatible types for addition');
      }
    }
    return new CSSMathSum(...numerics);
  }

  sub(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = values.map(toNumericValue);
    const negated = numerics.map(val => new CSSMathNegate(val));
    return this.add(...negated);
  }

  mul(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    return new CSSMathProduct(...numerics);
  }

  div(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = values.map(toNumericValue);
    const inverted = numerics.map(val => new CSSMathInvert(val));
    return this.mul(...inverted);
  }

  min(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    const firstType = numerics[0]!.type();
    for (let i = 1; i < numerics.length; i++) {
      if (!typesEqual(firstType, numerics[i]!.type())) {
        throw new TypeError('CSSNumericValues are not of compatible types for min');
      }
    }
    return new CSSMathMin(...numerics);
  }

  max(...values: CSSNumberish[]): CSSNumericValue {
    const numerics = [this, ...values.map(toNumericValue)];
    const firstType = numerics[0]!.type();
    for (let i = 1; i < numerics.length; i++) {
      if (!typesEqual(firstType, numerics[i]!.type())) {
        throw new TypeError('CSSNumericValues are not of compatible types for max');
      }
    }
    return new CSSMathMax(...numerics);
  }

  equals(...values: CSSNumberish[]): boolean {
    const numerics = values.map(toNumericValue);
    const thisSum = createSumValue(this);
    if (!thisSum) return false;

    for (const val of numerics) {
      const otherSum = createSumValue(val);
      if (!otherSum || thisSum.length !== otherSum.length) return false;
      // Compare sums (order-independent)
      // Since sums are small, we can do a naive match
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

  to(unit: string): CSSUnitValue {
    return to(this, unit);
  }

  toSum(...units: string[]): CSSMathSum {
    return toSum(this, ...units);
  }
}

function createEmptyType(): CSSNumericType {
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

function typesEqual(t1: CSSNumericType, t2: CSSNumericType): boolean {
  return t1.length === t2.length &&
         t1.angle === t2.angle &&
         t1.time === t2.time &&
         t1.frequency === t2.frequency &&
         t1.resolution === t2.resolution &&
         t1.flex === t2.flex &&
         t1.percent === t2.percent &&
         t1.percentHint === t2.percentHint;
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

export class CSSUnitValue extends CSSNumericValue {
  constructor(public value: number, public unit: string) {
    super();
    if (typeof value !== 'number' || isNaN(value)) {
      throw new TypeError('CSSUnitValue value must be a number');
    }
    if (typeof unit !== 'string') {
      throw new TypeError('CSSUnitValue unit must be a string');
    }
  }

  type(): CSSNumericType {
    const t = createEmptyType();
    if (this.unit === 'number') {
      return t;
    }
    if (this.unit === 'percent') {
      t.percent = 1;
      return t;
    }
    const baseType = createAType(this.unit);
    if (!baseType) {
      throw new TypeError(`Unknown unit: ${this.unit}`);
    }
    // baseType is like { length: 1 } or { angle: 1 }, etc.
    Object.assign(t, baseType);
    return t;
  }

  toString(): string {
    if (this.unit === 'number') {
      return `${this.value}`;
    }
    if (this.unit === 'percent') {
      return `${this.value}%`;
    }
    return `${this.value}${this.unit}`;
  }
}

export abstract class CSSMathValue extends CSSNumericValue {
  abstract get operator(): string;
}

export class CSSNumericArray {
  private _values: CSSNumericValue[];

  constructor(values: CSSNumericValue[]) {
    this._values = [...values];
  }

  get length(): number {
    return this._values.length;
  }

  [index: number]: CSSNumericValue;

  static create(values: CSSNumericValue[]): CSSNumericArray {
    const instance = new CSSNumericArray(values);
    return new Proxy(instance, {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          const index = Number(prop);
          if (Number.isInteger(index) && index >= 0 && index < target._values.length) {
            return target._values[index];
          }
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as any;
  }

  *[Symbol.iterator](): Iterator<CSSNumericValue> {
    for (const val of this._values) {
      yield val;
    }
  }
}

export class CSSMathSum extends CSSMathValue {
  public values: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new TypeError('CSSMathSum requires at least one argument');
    }
    this.values = CSSNumericArray.create(values);
  }

  get operator(): string {
    return 'sum';
  }

  type(): CSSNumericType {
    // Returns the type of its first argument (all arguments must be compatible)
    return this.values[0]!.type();
  }

  toString(): string {
    if (this.values.length === 1) {
      return `calc(${this.values[0]!.toString()})`;
    }
    const argStr = Array.from(this.values).map(val => val.toString()).join(' + ');
    return `calc(${argStr})`;
  }
}

export class CSSMathProduct extends CSSMathValue {
  public values: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new TypeError('CSSMathProduct requires at least one argument');
    }
    this.values = CSSNumericArray.create(values);
  }

  get operator(): string {
    return 'product';
  }

  type(): CSSNumericType {
    const result = createEmptyType();
    for (const val of this.values) {
      const t = val.type();
      result.length += t.length;
      result.angle += t.angle;
      result.time += t.time;
      result.frequency += t.frequency;
      result.resolution += t.resolution;
      result.flex += t.flex;
      result.percent += t.percent;
      if (t.percentHint) {
        if (result.percentHint && result.percentHint !== t.percentHint) {
          throw new TypeError('Incompatible percent hints');
        }
        result.percentHint = t.percentHint;
      }
    }
    return result;
  }

  toString(): string {
    const argStr = Array.from(this.values).map(val => {
      if (val instanceof CSSMathSum) {
        return `(${val.toString()})`;
      }
      return val.toString();
    }).join(' * ');
    return `calc(${argStr})`;
  }
}

export class CSSMathNegate extends CSSMathValue {
  constructor(public value: CSSNumericValue) {
    super();
  }

  get operator(): string {
    return 'negate';
  }

  type(): CSSNumericType {
    return this.value.type();
  }

  toString(): string {
    return `calc(-${this.value.toString()})`;
  }
}

export class CSSMathInvert extends CSSMathValue {
  constructor(public value: CSSNumericValue) {
    super();
  }

  get operator(): string {
    return 'invert';
  }

  type(): CSSNumericType {
    const t = this.value.type();
    const result: CSSNumericType = {
      length: -t.length,
      angle: -t.angle,
      time: -t.time,
      frequency: -t.frequency,
      resolution: -t.resolution,
      flex: -t.flex,
      percent: -t.percent
    };
    if (t.percentHint !== undefined) {
      result.percentHint = t.percentHint;
    }
    return result;
  }

  toString(): string {
    return `calc(1 / ${this.value.toString()})`;
  }
}

export class CSSMathMin extends CSSMathValue {
  public values: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new TypeError('CSSMathMin requires at least one argument');
    }
    this.values = CSSNumericArray.create(values);
  }

  get operator(): string {
    return 'min';
  }

  type(): CSSNumericType {
    return this.values[0]!.type();
  }

  toString(): string {
    const argStr = Array.from(this.values).map(val => val.toString()).join(', ');
    return `min(${argStr})`;
  }
}

export class CSSMathMax extends CSSMathValue {
  public values: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new TypeError('CSSMathMax requires at least one argument');
    }
    this.values = CSSNumericArray.create(values);
  }

  get operator(): string {
    return 'max';
  }

  type(): CSSNumericType {
    return this.values[0]!.type();
  }

  toString(): string {
    const argStr = Array.from(this.values).map(val => val.toString()).join(', ');
    return `max(${argStr})`;
  }
}

export class CSSMathClamp extends CSSMathValue {
  public lower: CSSNumericValue;
  public value: CSSNumericValue;
  public upper: CSSNumericValue;

  constructor(lower: CSSNumberish, value: CSSNumberish, upper: CSSNumberish) {
    super();
    this.lower = toNumericValue(lower);
    this.value = toNumericValue(value);
    this.upper = toNumericValue(upper);

    const tL = this.lower.type();
    const tV = this.value.type();
    const tU = this.upper.type();

    if (!typesEqual(tL, tV) || !typesEqual(tV, tU)) {
      throw new TypeError('CSSMathClamp arguments must be of compatible types');
    }
  }

  get operator(): string {
    return 'clamp';
  }

  type(): CSSNumericType {
    return this.value.type();
  }

  toString(): string {
    return `clamp(${this.lower.toString()}, ${this.value.toString()}, ${this.upper.toString()})`;
  }
}
