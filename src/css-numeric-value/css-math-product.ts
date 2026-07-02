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

    const values = Array.from(this.values).map(toCanonical);
    const unitValues: { val: CSSNumericValue; index: number }[] = [];
    const otherValues: { val: CSSNumericValue; index: number }[] = [];

    for (let i = 0; i < values.length; i++) {
      const val = values[i]!;
      if (val instanceof CSSMathValue) {
        otherValues.push({ val, index: i });
      } else {
        unitValues.push({ val, index: i });
      }
    }

    unitValues.sort((a, b) => compareTerms(a.val, b.val));

    const processedValues: CSSNumericValue[] = new Array(values.length);
    for (const item of otherValues) {
      processedValues[item.index] = item.val;
    }
    let unitIdx = 0;
    for (let i = 0; i < processedValues.length; i++) {
      if (processedValues[i] === undefined) {
        processedValues[i] = unitValues[unitIdx]!.val;
        unitIdx++;
      }
    }

    s += processedValues[0]!._serialize(true, false);

    for (let i = 1; i < processedValues.length; i++) {
      const val = processedValues[i]!;
      if (val instanceof CSSMathInvert) {
        s += ' / ';
        s += val.value._serialize(true, false);
      } else {
        s += ' * ';
        s += val._serialize(true, false);
      }
    }

    if (!parenLess) {
      s += ')';
    }
    return s;
  }
}
