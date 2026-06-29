import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, type CSSNumericType, toNumericValue, createEmptyType, cleanType, multiplyTypes } from './css-numeric-value';
import { CSSMathSum } from './css-math-sum';

// https://drafts.css-houdini.org/css-typed-om-1/#cssmathproduct
export class CSSMathProduct extends CSSMathValue {
  private _values!: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new DOMException('CSSMathProduct requires at least one argument', 'SyntaxError');
    }
    this._values = CSSNumericArray.create(values);
    this.type();
  }

  get values(): CSSNumericArray {
    if (!(this instanceof CSSMathProduct)) {
      throw new TypeError("Value of 'this' is not a CSSMathProduct");
    }
    return this._values;
  }

  get operator(): string {
    if (!(this instanceof CSSMathProduct)) {
      throw new TypeError("Value of 'this' is not a CSSMathProduct");
    }
    return 'product';
  }

  type(): CSSNumericType {
    let result = createEmptyType();
    for (const val of this.values) {
      const nextType = multiplyTypes(result, val.type());
      if (!nextType) {
        throw new TypeError('Incompatible percent hints');
      }
      result = nextType;
    }
    return result;
  }

  toString(): string {
    const argStr = Array.from(this.values).map(val => {
      if (val instanceof CSSMathSum) {
        return `(${val.toString()})`;
      }
      return val.toString();
    }).join(' * ');
    return `calc(${argStr})`;
  }
}
