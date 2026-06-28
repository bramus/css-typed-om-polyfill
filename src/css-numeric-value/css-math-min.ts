import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, type CSSNumericType, toNumericValue } from './css-numeric-value';

export class CSSMathMin extends CSSMathValue {
  public values: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new TypeError('CSSMathMin requires at least one argument');
    }
    this.values = CSSNumericArray.create(values);
  }

  get operator(): string {
    return 'min';
  }

  type(): CSSNumericType {
    return this.values[0]!.type();
  }

  toString(): string {
    const argStr = Array.from(this.values).map(val => val.toString()).join(', ');
    return `min(${argStr})`;
  }
}
