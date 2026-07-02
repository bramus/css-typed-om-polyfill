import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, type CSSNumberish, toNumericValue, cleanType } from './css-numeric-value';

export class CSSMathInvert extends CSSMathValue {
  private _value!: CSSNumericValue;

  constructor(value: CSSNumberish) {
    super();
    this._value = toNumericValue(value);
  }

  get value(): CSSNumericValue {
    if (!(this instanceof CSSMathInvert)) {
      throw new TypeError("Value of 'this' is not a CSSMathInvert");
    }
    return this._value;
  }

  get operator(): string {
    if (!(this instanceof CSSMathInvert)) {
      throw new TypeError("Value of 'this' is not a CSSMathInvert");
    }
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

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-cssmathinvert
  _serialize(nested: boolean, parenLess: boolean, minimum?: CSSNumericValue, maximum?: CSSNumericValue, inProductNegateInvert?: boolean): string {
    if (!(this instanceof CSSMathInvert)) {
      throw new TypeError("Value of 'this' is not a CSSMathInvert");
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
    // 2. Append "1 / " to s.
    s += '1 / ';
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
