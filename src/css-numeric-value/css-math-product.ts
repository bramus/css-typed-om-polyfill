import { CSSMathValue, checkAndCreateValues } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { CSSNumericValue, type CSSNumberish, type CSSNumericType, createEmptyType, multiplyTypes } from './css-numeric-value';
import { toCanonical, compareTerms } from './serialization-helpers';
import { CSSMathInvert } from './css-math-invert';



// https://drafts.css-houdini.org/css-typed-om-1/#cssmathproduct
export class CSSMathProduct extends CSSMathValue {
  private _values!: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    this._values = checkAndCreateValues('CSSMathProduct', args);
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

  _serialize(nested: boolean, parenLess: boolean): string {
    let s = '';
    if (parenLess) {
      // continue
    } else if (nested) {
      s += '(';
    } else {
      s += 'calc(';
    }

    const numerator: CSSNumericValue[] = [];
    const denominator: CSSNumericValue[] = [];

    for (const val of this.values) {
      const canonical = toCanonical(val);
      if (canonical instanceof CSSMathInvert) {
        denominator.push((canonical as any).value);
      } else {
        numerator.push(canonical);
      }
    }

    numerator.sort(compareTerms);
    denominator.sort(compareTerms);

    if (numerator.length === 0) {
      s += '1';
    } else {
      s += numerator[0]!._serialize(true, false);
      for (let i = 1; i < numerator.length; i++) {
        s += ' * ';
        s += numerator[i]!._serialize(true, false);
      }
    }

    if (denominator.length > 0) {
      s += ' / ';
      const wrapDenominator = denominator.length > 1;
      if (wrapDenominator) {
        s += '(';
      }
      s += denominator[0]!._serialize(true, false);
      for (let i = 1; i < denominator.length; i++) {
        s += ' * ';
        s += denominator[i]!._serialize(true, false);
      }
      if (wrapDenominator) {
        s += ')';
      }
    }

    if (!parenLess) {
      s += ')';
    }
    return s;
  }
}
