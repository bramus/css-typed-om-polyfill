import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, toNumericValue, typesEqual } from './css-numeric-value';

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
