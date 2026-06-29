import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, type CSSNumericType, toNumericValue, addTypes } from './css-numeric-value';

import { toCanonical, compareTerms } from './serialization-helpers';

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

  _serialize(nested: boolean, parenLess: boolean): string {
    let s = '';
    if (parenLess) {
      // continue
    } else if (nested) {
      s += '(';
    } else {
      s += 'calc(';
    }

    const processedValues = Array.from(this.values)
      .map(toCanonical)
      .sort(compareTerms);

    s += processedValues[0]!._serialize(true, false);

    for (let i = 1; i < processedValues.length; i++) {
      const arg = processedValues[i]!;
      if (arg instanceof CSSMathValue && arg.operator === 'negate') {
        s += ' - ';
        s += (arg as any).value._serialize(true, false);
      } else {
        s += ' + ';
        s += arg._serialize(true, false);
      }
    }

    if (!parenLess) {
      s += ')';
    }
    return s;
  }
}
