import { CSSNumericValue, type CSSNumericType } from './css-numeric-value';
import { createAType } from '../parser/unit-utils';

// https://drafts.css-houdini.org/css-typed-om-1/#cssunitvalue
export class CSSUnitValue extends CSSNumericValue {
  private _value!: number;
  private _unit!: string;

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssunitvalue-cssunitvalue
  constructor(value: number, unit: string) {
    super();
    if (typeof value !== 'number' || isNaN(value)) {
      throw new TypeError('CSSUnitValue value must be a number');
    }
    if (typeof unit !== 'string') {
      throw new TypeError('CSSUnitValue unit must be a string');
    }
    this._value = value;
    this._unit = unit.toLowerCase();
    if (!createAType(this._unit)) {
      throw new TypeError(`Unknown unit: ${unit}`);
    }
  }

  get value(): number {
    if (!(this instanceof CSSUnitValue)) {
      throw new TypeError("Value of 'this' is not a CSSUnitValue");
    }
    return this._value;
  }

  set value(val: number) {
    if (!(this instanceof CSSUnitValue)) {
      throw new TypeError("Value of 'this' is not a CSSUnitValue");
    }
    if (typeof val !== 'number' || isNaN(val)) {
      throw new TypeError('CSSUnitValue value must be a number');
    }
    this._value = val;
  }

  get unit(): string {
    if (!(this instanceof CSSUnitValue)) {
      throw new TypeError("Value of 'this' is not a CSSUnitValue");
    }
    return this._unit;
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssunitvalue-type
  type(): CSSNumericType {
    return createAType(this.unit)!;
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
