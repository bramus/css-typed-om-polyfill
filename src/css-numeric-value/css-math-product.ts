import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { CSSNumericValue, type CSSNumberish, type CSSNumericType, toNumericValue, createEmptyType, cleanType, multiplyTypes } from './css-numeric-value';
import { toCanonical, compareTerms } from './serialization-helpers';



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
      if (arg instanceof CSSMathValue && arg.operator === 'invert') {
        s += ' / ';
        s += (arg as any).value._serialize(true, false);
      } else {
        s += ' * ';
        s += arg._serialize(true, false);
      }
    }

    if (!parenLess) {
      s += ')';
    }
    return s;
  }
}
