import { CSSNumericValue, type CSSNumericType } from './css-numeric-value';
import { createAType } from '../parser/unit-utils';

// https://drafts.css-houdini.org/css-typed-om-1/#cssunitvalue
export class CSSUnitValue extends CSSNumericValue {
  readonly unit: string;

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssunitvalue-cssunitvalue
  constructor(public value: number, unit: string) {
    super();
    if (typeof value !== 'number' || isNaN(value)) {
      throw new TypeError('CSSUnitValue value must be a number');
    }
    if (typeof unit !== 'string') {
      throw new TypeError('CSSUnitValue unit must be a string');
    }
    this.unit = unit.toLowerCase();
    if (!createAType(this.unit)) {
      throw new TypeError(`Unknown unit: ${unit}`);
    }
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
