import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType } from './css-numeric-value';

export class CSSMathInvert extends CSSMathValue {
  constructor(public value: CSSNumericValue) {
    super();
  }

  get operator(): string {
    return 'invert';
  }

  type(): CSSNumericType {
    const t = this.value.type();
    const result: CSSNumericType = {
      length: -t.length,
      angle: -t.angle,
      time: -t.time,
      frequency: -t.frequency,
      resolution: -t.resolution,
      flex: -t.flex,
      percent: -t.percent
    };
    if (t.percentHint !== undefined) {
      result.percentHint = t.percentHint;
    }
    return result;
  }

  toString(): string {
    return `calc(1 / ${this.value.toString()})`;
  }
}
