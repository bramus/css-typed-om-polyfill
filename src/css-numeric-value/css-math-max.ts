import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, type CSSNumericType, toNumericValue, addTypes } from './css-numeric-value';

export class CSSMathMax extends CSSMathValue {
  public values: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new DOMException('CSSMathMax requires at least one argument', 'SyntaxError');
    }
    this.values = CSSNumericArray.create(values);
    this.type();
  }

  get operator(): string {
    return 'max';
  }

  type(): CSSNumericType {
    let result = this.values[0]!.type();
    for (let i = 1; i < this.values.length; i++) {
      const next = addTypes(result, this.values[i]!.type());
      if (!next) {
        throw new TypeError('CSSNumericValues are not of compatible types for max');
      }
      result = next;
    }
    return result;
  }

  toString(): string {
    const argStr = Array.from(this.values).map(val => val.toString()).join(', ');
    return `max(${argStr})`;
  }
}
