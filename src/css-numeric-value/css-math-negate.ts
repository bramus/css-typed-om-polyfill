import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, type CSSNumberish, toNumericValue } from './css-numeric-value';

export class CSSMathNegate extends CSSMathValue {
  readonly value: CSSNumericValue;

  constructor(value: CSSNumberish) {
    super();
    this.value = toNumericValue(value);
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
