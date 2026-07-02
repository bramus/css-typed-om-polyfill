import { CSSMathValue, checkAndCreateValues } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { CSSNumericValue, type CSSNumberish, type CSSNumericType, addTypes } from './css-numeric-value';

import { toCanonical, compareTerms } from './serialization-helpers';

// https://drafts.css-houdini.org/css-typed-om-1/#cssmathsum
export class CSSMathSum extends CSSMathValue {
  private _values!: CSSNumericArray;

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-cssmathsum-cssmathsum
  constructor(...args: CSSNumberish[]) {
    super();
    this._values = checkAndCreateValues('CSSMathSum', args);
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

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-cssmathsum
  _serialize(nested: boolean, parenLess: boolean, minimum?: CSSNumericValue, maximum?: CSSNumericValue, inProductNegateInvert?: boolean): string {
    if (!(this instanceof CSSMathSum)) {
      throw new TypeError("Value of 'this' is not a CSSMathSum");
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

    // 2. Let values be the result of canonicalizing and sorting the items in this’s values internal slot.
    const processedValues = Array.from(this.values)
      .map(toCanonical)
      .sort(compareTerms);

    // 3. Serialize values[0] with nested set to true, and append the result to s.
    s += processedValues[0]!._serialize(true, false, undefined, undefined, false);

    // 4. For each item in values after the first:
    for (let i = 1; i < processedValues.length; i++) {
      const arg = processedValues[i]!;
      // 4.1. If item is a CSSMathNegate object:
      //      1. Append " - " to s.
      //      2. Serialize item’s value internal slot with nested set to true, and append the result to s.
      if (arg instanceof CSSMathValue && arg.operator === 'negate') {
        s += ' - ';
        s += (arg as any).value._serialize(true, false, undefined, undefined, false);
      } else if ('value' in arg && 'unit' in arg && typeof (arg as any).value === 'number' && (arg as any).value < 0) {
        // 4.2. Otherwise, if item is a CSSUnitValue with a negative value:
        //      1. Append " - " to s.
        //      2. Let negated be a new CSSUnitValue with the same unit as item, and a value equal to the negation of item’s value.
        //      3. Serialize negated with nested set to true, and append the result to s.
        s += ' - ';
        const negated = new (arg.constructor as any)(-(arg as any).value, (arg as any).unit);
        s += negated._serialize(true, false, undefined, undefined, false);
      } else {
        // 4.3. Otherwise:
        //      1. Append " + " to s.
        //      2. Serialize item with nested set to true, and append the result to s.
        s += ' + ';
        s += arg._serialize(true, false, undefined, undefined, false);
      }
    }

    // 5. If paren-less is false, append ")" to s.
    if (!parenLess) {
      s += ')';
    }
    // 6. Return s.
    return s;
  }
}
