import { CSSColorValue, toRGBComponent, toPercentComponent, type CSSColorRGBComp, type CSSColorPercent } from './css-color-value';
import { type CSSNumberish, CSSUnitValue } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssrgb
export class CSSRGB extends CSSColorValue {
  private _r!: CSSColorRGBComp;
  private _g!: CSSColorRGBComp;
  private _b!: CSSColorRGBComp;
  private _alpha!: CSSColorPercent;

  constructor(
    r: CSSNumberish | CSSKeywordValue | string,
    g: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.r = r;
    this.g = g;
    this.b = b;
    this.alpha = alpha;
  }

  get r(): CSSColorRGBComp {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    return this._r;
  }
  set r(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    this._r = toRGBComponent(val, 'CSSRGB.r');
  }

  get g(): CSSColorRGBComp {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    return this._g;
  }
  set g(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    this._g = toRGBComponent(val, 'CSSRGB.g');
  }

  get b(): CSSColorRGBComp {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    return this._b;
  }
  set b(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    this._b = toRGBComponent(val, 'CSSRGB.b');
  }

  get alpha(): CSSColorPercent {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    return this._alpha;
  }
  set alpha(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSRGB)) {
      throw new TypeError("Value of 'this' is not a CSSRGB");
    }
    this._alpha = toPercentComponent(val, 'CSSRGB.alpha');
  }

  toString(): string {
    const r = this.r.toString();
    const g = this.g.toString();
    const b = this.b.toString();
    
    let alphaVal = 1;
    if (this.alpha instanceof CSSUnitValue) {
      if (this.alpha.unit === 'percent') {
        alphaVal = this.alpha.value / 100;
      } else if (this.alpha.unit === 'number') {
        alphaVal = this.alpha.value;
      }
    }
    
    if (alphaVal === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${alphaVal})`;
    }
  }
}
