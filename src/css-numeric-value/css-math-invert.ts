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

  _serialize(nested: boolean, parenLess: boolean): string {
    let s = '';
    if (parenLess) {
      // continue
    } else if (nested) {
      s += '(';
    } else {
      s += 'calc(';
    }
    s += '1 / ';
    s += this.value._serialize(true, false);
    if (!parenLess) {
      s += ')';
    }
    return s;
  }
}
