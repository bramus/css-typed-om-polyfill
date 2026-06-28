import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, toNumericValue, addTypes, type CSSNumberish } from './css-numeric-value';

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

    const tLV = addTypes(tL, tV);
    if (!tLV || !addTypes(tLV, tU)) {
      throw new TypeError('CSSMathClamp arguments must be of compatible types');
    }
  }

  get operator(): string {
    return 'clamp';
  }

  type(): CSSNumericType {
    const tLV = addTypes(this.lower.type(), this.value.type());
    return addTypes(tLV!, this.upper.type())!;
  }

  toString(): string {
    return `clamp(${this.lower.toString()}, ${this.value.toString()}, ${this.upper.toString()})`;
  }
}
