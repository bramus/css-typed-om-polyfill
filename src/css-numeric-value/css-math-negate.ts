import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType } from './css-numeric-value';

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
