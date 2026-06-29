import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, type CSSNumberish, toNumericValue } from './css-numeric-value';

export class CSSMathNegate extends CSSMathValue {
  private _value!: CSSNumericValue;

  constructor(value: CSSNumberish) {
    super();
    this._value = toNumericValue(value);
  }

  get value(): CSSNumericValue {
    if (!(this instanceof CSSMathNegate)) {
      throw new TypeError("Value of 'this' is not a CSSMathNegate");
    }
    return this._value;
  }

  get operator(): string {
    if (!(this instanceof CSSMathNegate)) {
      throw new TypeError("Value of 'this' is not a CSSMathNegate");
    }
    return 'negate';
  }

  type(): CSSNumericType {
    return this.value.type();
  }

  toString(): string {
    return `calc(-${this.value.toString()})`;
  }
}
