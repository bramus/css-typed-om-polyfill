import { CSSNumericValue, type CSSNumberish, toNumericValue } from './css-numeric-value';
import { CSSNumericArray } from './css-numeric-array';

// https://drafts.css-houdini.org/css-typed-om-1/#cssmathvalue
export abstract class CSSMathValue extends CSSNumericValue {
  constructor() {
    super();
    if (this.constructor === CSSMathValue) {
      throw new TypeError('CSSMathValue cannot be directly constructed');
    }
  }

  get operator(): string {
    if (!(this instanceof CSSMathValue)) {
      throw new TypeError("Value of 'this' is not a CSSMathValue");
    }
    throw new TypeError('Abstract property');
  }
}

export function checkAndCreateValues(operatorName: string, args: CSSNumberish[]): CSSNumericArray {
  const values = args.map(toNumericValue);
  if (values.length === 0) {
    throw new DOMException(`${operatorName} requires at least one argument`, 'SyntaxError');
  }
  return CSSNumericArray.create(values);
}
