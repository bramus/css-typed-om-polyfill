import { CSSMathValue } from './css-math-value';
import { CSSNumericValue, type CSSNumericType, toNumericValue, addTypes, type CSSNumberish } from './css-numeric-value';

export class CSSMathClamp extends CSSMathValue {
  private _lower!: CSSNumericValue;
  private _value!: CSSNumericValue;
  private _upper!: CSSNumericValue;

  constructor(lower: CSSNumberish, value: CSSNumberish, upper: CSSNumberish) {
    super();
    this._lower = toNumericValue(lower);
    this._value = toNumericValue(value);
    this._upper = toNumericValue(upper);

    const tL = this._lower.type();
    const tV = this._value.type();
    const tU = this._upper.type();

    const tLV = addTypes(tL, tV);
    if (!tLV || !addTypes(tLV, tU)) {
      throw new TypeError('CSSMathClamp arguments must be of compatible types');
    }
  }

  get lower(): CSSNumericValue {
    if (!(this instanceof CSSMathClamp)) {
      throw new TypeError("Value of 'this' is not a CSSMathClamp");
    }
    return this._lower;
  }

  get value(): CSSNumericValue {
    if (!(this instanceof CSSMathClamp)) {
      throw new TypeError("Value of 'this' is not a CSSMathClamp");
    }
    return this._value;
  }

  get upper(): CSSNumericValue {
    if (!(this instanceof CSSMathClamp)) {
      throw new TypeError("Value of 'this' is not a CSSMathClamp");
    }
    return this._upper;
  }

  get operator(): string {
    if (!(this instanceof CSSMathClamp)) {
      throw new TypeError("Value of 'this' is not a CSSMathClamp");
    }
    return 'clamp';
  }

  type(): CSSNumericType {
    const tLV = addTypes(this.lower.type(), this.value.type());
    return addTypes(tLV!, this.upper.type())!;
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-cssmathclamp
  _serialize(nested: boolean, parenLess: boolean, minimum?: CSSNumericValue, maximum?: CSSNumericValue, inProductNegateInvert?: boolean): string {
    if (!(this instanceof CSSMathClamp)) {
      throw new TypeError("Value of 'this' is not a CSSMathClamp");
    }
    // 1. Let s be "clamp(".
    // 2. Serialize lower with nested set to true and paren-less set to true, and append the result to s.
    const lower = this.lower._serialize(true, true, undefined, undefined, false);
    // 3. Append ", " to s.
    // 4. Serialize value with nested set to true and paren-less set to true, and append the result to s.
    const value = this.value._serialize(true, true, undefined, undefined, false);
    // 5. Append ", " to s.
    // 6. Serialize upper with nested set to true and paren-less set to true, and append the result to s.
    const upper = this.upper._serialize(true, true, undefined, undefined, false);
    // 7. Append ")" to s.
    // 8. Return s.
    return `clamp(${lower}, ${value}, ${upper})`;
  }
}
