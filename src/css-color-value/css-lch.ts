import { CSSColorValue, toPercentComponent, toLCHHueComponent, type CSSColorPercent, type CSSColorAngle } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csslch
export class CSSLCH extends CSSColorValue {
  private _l!: CSSColorPercent;
  private _c!: CSSColorPercent;
  private _h!: CSSColorAngle;
  private _alpha!: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    c: CSSNumberish | CSSKeywordValue | string,
    h: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = l;
    this.c = c;
    this.h = h;
    this.alpha = alpha;
  }

  get l(): CSSColorPercent {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    return this._l;
  }
  set l(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    this._l = toPercentComponent(val, 'CSSLCH.l');
  }

  get c(): CSSColorPercent {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    return this._c;
  }
  set c(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    this._c = toPercentComponent(val, 'CSSLCH.c');
  }

  get h(): CSSColorAngle {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    return this._h;
  }
  set h(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    this._h = toLCHHueComponent(val);
  }

  get alpha(): CSSColorPercent {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    return this._alpha;
  }
  set alpha(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSLCH)) {
      throw new TypeError("Value of 'this' is not a CSSLCH");
    }
    this._alpha = toPercentComponent(val, 'CSSLCH.alpha');
  }

  toString(): string {
    return `lch(${this.l.toString()} ${this.c.toString()} ${this.h.toString()} / ${this.alpha.toString()})`;
  }
}
