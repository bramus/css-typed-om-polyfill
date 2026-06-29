import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, type CSSNumericType, toNumericValue, addTypes } from './css-numeric-value';

export class CSSMathMin extends CSSMathValue {
  private _values!: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new DOMException('CSSMathMin requires at least one argument', 'SyntaxError');
    }
    this._values = CSSNumericArray.create(values);
    this.type();
  }

  get values(): CSSNumericArray {
    if (!(this instanceof CSSMathMin)) {
      throw new TypeError("Value of 'this' is not a CSSMathMin");
    }
    return this._values;
  }

  get operator(): string {
    if (!(this instanceof CSSMathMin)) {
      throw new TypeError("Value of 'this' is not a CSSMathMin");
    }
    return 'min';
  }

  type(): CSSNumericType {
    let result = this.values[0]!.type();
    for (let i = 1; i < this.values.length; i++) {
      const next = addTypes(result, this.values[i]!.type());
      if (!next) {
        throw new TypeError('CSSNumericValues are not of compatible types for min');
      }
      result = next;
    }
    return result;
  }

  _serialize(nested: boolean, parenLess: boolean): string {
    const argStr = Array.from(this.values).map(val => val._serialize(true, true)).join(', ');
    return `min(${argStr})`;
  }
}
