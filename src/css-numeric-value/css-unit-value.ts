import { CSSNumericValue, type CSSNumericType } from './css-numeric-value';
import { createAType } from '../parser/unit-utils';

// https://drafts.css-houdini.org/css-typed-om-1/#cssunitvalue
export class CSSUnitValue extends CSSNumericValue {
  private _value!: number;
  private _unit!: string;

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssunitvalue-cssunitvalue
  constructor(value: number, unit: string) {
    super();
    // @NOTE: WebIDL type checks.
    if (typeof value !== 'number' || isNaN(value)) {
      throw new TypeError('CSSUnitValue value must be a number');
    }
    if (typeof unit !== 'string') {
      throw new TypeError('CSSUnitValue unit must be a string');
    }
    // 1. Set this's value to value.
    this._value = value;
    // 2. Set this's unit to unit (case-insensitively).
    this._unit = unit.toLowerCase();
    // 3. If unit is not a valid CSS unit, throw a TypeError.
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-type
  type(): CSSNumericType {
    // @NOTE: Returning a CSSNumericType representing the unit.
    return createAType(this.unit)!;
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-cssunitvalue
  _serialize(
    nested: boolean,
    parenLess: boolean,
    minimum?: CSSNumericValue,
    maximum?: CSSNumericValue,
    inProductNegateInvert?: boolean
  ): string {
    let s = '';
    // @NOTE: Deviating from spec: We support minimum/maximum bounds checking
    // and wrap in calc() if the value is out of bounds. This is a polyfill-specific
    // feature to ensure valid CSS serialization for restricted properties.
    let wrapInCalc = false;
    if (minimum instanceof CSSUnitValue) {
      if (this.unit === minimum.unit) {
        if (this.value < minimum.value) {
          wrapInCalc = true;
        }
      } else {
        if (minimum.value === 0 && this.value < 0) {
          wrapInCalc = true;
        } else {
          wrapInCalc = true;
        }
      }
    }
    if (maximum instanceof CSSUnitValue) {
      if (this.unit === maximum.unit) {
        if (this.value > maximum.value) {
          wrapInCalc = true;
        }
      } else {
        if (maximum.value === 0 && this.value > 0) {
          wrapInCalc = true;
        } else {
          wrapInCalc = true;
        }
      }
    }

    if ((minimum && !(minimum instanceof CSSUnitValue)) || (maximum && !(maximum instanceof CSSUnitValue))) {
      wrapInCalc = true;
    }

    // 2. If value is less than 0, and this is being serialized as a component of a CSSMathProduct,
    //    or is the value of a CSSMathNegate, or is the value of a CSSMathInvert:
    //    Append "(" to s.
    const needsParens = !wrapInCalc && inProductNegateInvert && this.value < 0;

    if (needsParens) {
      s += '(';
    }

    // 3. Serialize value and unit
    if (this.unit === 'number') {
      s += `${this.value}`;
    } else if (this.unit === 'percent') {
      s += `${this.value}%`;
    } else {
      s += `${this.value}${this.unit}`;
    }

    // 4. Append ")" if needed
    if (needsParens) {
      s += ')';
    }

    if (wrapInCalc) {
      return `calc(${s})`;
    }
    return s;
  }
}
