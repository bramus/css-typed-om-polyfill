import { CSSNumericValue, type CSSNumericType, createEmptyType } from './css-numeric-value';
import { createAType } from '../parser/css-numeric-parser';

// https://drafts.css-houdini.org/css-typed-om-1/#cssunitvalue
export class CSSUnitValue extends CSSNumericValue {
  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssunitvalue-cssunitvalue
  constructor(public value: number, public unit: string) {
    super();
    if (typeof value !== 'number' || isNaN(value)) {
      throw new TypeError('CSSUnitValue value must be a number');
    }
    if (typeof unit !== 'string') {
      throw new TypeError('CSSUnitValue unit must be a string');
    }
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssunitvalue-type
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
