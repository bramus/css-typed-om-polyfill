import { CSSNumericValue } from './css-numeric-value';

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
