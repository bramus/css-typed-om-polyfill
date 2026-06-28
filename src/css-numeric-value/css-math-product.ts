import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, type CSSNumericType, toNumericValue, createEmptyType } from './css-numeric-value';
import { CSSMathSum } from './css-math-sum';

// https://drafts.css-houdini.org/css-typed-om-1/#cssmathproduct
export class CSSMathProduct extends CSSMathValue {
  public values: CSSNumericArray;

  constructor(...args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new TypeError('CSSMathProduct requires at least one argument');
    }
    this.values = CSSNumericArray.create(values);
  }

  get operator(): string {
    return 'product';
  }

  type(): CSSNumericType {
    const result = createEmptyType();
    for (const val of this.values) {
      const t = val.type();
      result.length += t.length;
      result.angle += t.angle;
      result.time += t.time;
      result.frequency += t.frequency;
      result.resolution += t.resolution;
      result.flex += t.flex;
      result.percent += t.percent;
      if (t.percentHint) {
        if (result.percentHint && result.percentHint !== t.percentHint) {
          throw new TypeError('Incompatible percent hints');
        }
        result.percentHint = t.percentHint;
      }
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
