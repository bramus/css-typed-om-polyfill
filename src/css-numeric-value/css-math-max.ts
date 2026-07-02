import { CSSMathValue, checkAndCreateValues } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { CSSNumericValue, type CSSNumberish, type CSSNumericType, addTypes } from './css-numeric-value';

export class CSSMathMax extends CSSMathValue {
  private _values!: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    this._values = checkAndCreateValues('CSSMathMax', args);
    this.type();
  }

  get values(): CSSNumericArray {
    if (!(this instanceof CSSMathMax)) {
      throw new TypeError("Value of 'this' is not a CSSMathMax");
    }
    return this._values;
  }

  get operator(): string {
    if (!(this instanceof CSSMathMax)) {
      throw new TypeError("Value of 'this' is not a CSSMathMax");
    }
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

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-cssmathmax
  _serialize(nested: boolean, parenLess: boolean, minimum?: CSSNumericValue, maximum?: CSSNumericValue, inProductNegateInvert?: boolean): string {
    if (!(this instanceof CSSMathMax)) {
      throw new TypeError("Value of 'this' is not a CSSMathMax");
    }
    // 1. Let s be "max(".
    // 2. For each item in this’s values internal slot, serialize the item with nested set to true
    //    and paren-less set to true, and append the result, comma-separated, to s.
    const argStr = Array.from(this.values).map(val => val._serialize(true, true, undefined, undefined, false)).join(', ');
    // 3. Append ")" to s.
    // 4. Return s.
    return `max(${argStr})`;
  }
}
