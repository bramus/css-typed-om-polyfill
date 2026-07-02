import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, type CSSNumberish, toNumericValue } from './css-numeric-value';

export class CSSMathNegate extends CSSMathValue {
  private _value!: CSSNumericValue;

  constructor(value: CSSNumberish) {
    super();
    this._value = toNumericValue(value);
  }

  get value(): CSSNumericValue {
    if (!(this instanceof CSSMathNegate)) {
      throw new TypeError("Value of 'this' is not a CSSMathNegate");
    }
    return this._value;
  }

  get operator(): string {
    if (!(this instanceof CSSMathNegate)) {
      throw new TypeError("Value of 'this' is not a CSSMathNegate");
    }
    return 'negate';
  }

  type(): CSSNumericType {
    return this.value.type();
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-cssmathnegate
  _serialize(nested: boolean, parenLess: boolean, minimum?: CSSNumericValue, maximum?: CSSNumericValue, inProductNegateInvert?: boolean): string {
    if (!(this instanceof CSSMathNegate)) {
      throw new TypeError("Value of 'this' is not a CSSMathNegate");
    }
    let s = '';
    // 1. If paren-less is true, continue to the next step;
    //    otherwise, if nested is true, append "(" to s;
    //    otherwise, append "calc(" to s.
    if (parenLess) {
      // continue
    } else if (nested) {
      s += '(';
    } else {
      s += 'calc(';
    }
    // 2. Append "-" to s.
    s += '-';
    // 3. Serialize this’s value internal slot with nested set to true, and append the result to s.
    s += this.value._serialize(true, false, undefined, undefined, true);
    // 4. If paren-less is false, append ")" to s.
    if (!parenLess) {
      s += ')';
    }
    // 5. Return s.
    return s;
  }
}
