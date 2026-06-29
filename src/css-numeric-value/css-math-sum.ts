import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, type CSSNumericType, toNumericValue, addTypes } from './css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssmathsum
export class CSSMathSum extends CSSMathValue {
  private _values!: CSSNumericArray;

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssmathsum-cssmathsum
  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new DOMException('CSSMathSum requires at least one argument', 'SyntaxError');
    }
    this._values = CSSNumericArray.create(values);
    this.type();
  }

  get values(): CSSNumericArray {
    if (!(this instanceof CSSMathSum)) {
      throw new TypeError("Value of 'this' is not a CSSMathSum");
    }
    return this._values;
  }

  get operator(): string {
    if (!(this instanceof CSSMathSum)) {
      throw new TypeError("Value of 'this' is not a CSSMathSum");
    }
    return 'sum';
  }

  type(): CSSNumericType {
    let currentType = this.values[0]!.type();
    for (let i = 1; i < this.values.length; i++) {
      const nextType = this.values[i]!.type();
      const addedType = addTypes(currentType, nextType);
      if (!addedType) {
        throw new TypeError('CSSNumericValues are not of compatible types for addition');
      }
      currentType = addedType;
    }
    return currentType;
  }

  toString(): string {
    if (this.values.length === 1) {
      return `calc(${this.values[0]!.toString()})`;
    }
    const argStr = Array.from(this.values).map(val => val.toString()).join(' + ');
    return `calc(${argStr})`;
  }
}
