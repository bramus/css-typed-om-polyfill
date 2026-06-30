import { CSSMathValue } from './css-math-value';
import { CSSNumericArray } from './css-numeric-array';
import { type CSSNumberish, toNumericValue } from './css-numeric-value';

export abstract class CSSMathVariadic extends CSSMathValue {
  protected _values: CSSNumericArray;

  constructor(operatorName: string, args: CSSNumberish[]) {
    super();
    const values = args.map(toNumericValue);
    if (values.length === 0) {
      throw new DOMException(`${operatorName} requires at least one argument`, 'SyntaxError');
    }
    this._values = CSSNumericArray.create(values);
  }
}
