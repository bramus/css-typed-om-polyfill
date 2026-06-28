import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, type CSSNumberish, toNumericValue, cleanType } from './css-numeric-value';

export class CSSMathInvert extends CSSMathValue {
  readonly value: CSSNumericValue;

  constructor(value: CSSNumberish) {
    super();
    this.value = toNumericValue(value);
  }

  get operator(): string {
    return 'invert';
  }

  type(): CSSNumericType {
    const t = this.value.type();
    const result: CSSNumericType = {};
    const keys: Exclude<keyof CSSNumericType, 'percentHint'>[] = ['length', 'angle', 'time', 'frequency', 'resolution', 'flex', 'percent'];
    for (const k of keys) {
      if (t[k] !== undefined && t[k] !== 0) {
        result[k] = -t[k]!;
      }
    }
    if (t.percentHint !== undefined) {
      result.percentHint = t.percentHint;
    }
    return result;
  }

  toString(): string {
    return `calc(1 / ${this.value.toString()})`;
  }
}
