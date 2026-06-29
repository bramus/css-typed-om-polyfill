import { CSSColorValue, toHSLHueComponent, toPercentComponent, type CSSColorAngle, type CSSColorPercent } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csshsl
export class CSSHSL extends CSSColorValue {
  private _h!: CSSColorAngle;
  private _s!: CSSColorPercent;
  private _l!: CSSColorPercent;
  private _alpha!: CSSColorPercent;

  constructor(
    h: CSSNumberish | CSSKeywordValue | string,
    s: CSSNumberish | CSSKeywordValue | string,
    l: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.h = h;
    this.s = s;
    this.l = l;
    this.alpha = alpha;
  }

  get h(): CSSColorAngle {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    return this._h;
  }
  set h(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    this._h = toHSLHueComponent(val);
  }

  get s(): CSSColorPercent {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    return this._s;
  }
  set s(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    this._s = toPercentComponent(val, 'CSSHSL.s');
  }

  get l(): CSSColorPercent {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    return this._l;
  }
  set l(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    this._l = toPercentComponent(val, 'CSSHSL.l');
  }

  get alpha(): CSSColorPercent {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    return this._alpha;
  }
  set alpha(val: CSSNumberish | CSSKeywordValue | string) {
    if (!(this instanceof CSSHSL)) {
      throw new TypeError("Value of 'this' is not a CSSHSL");
    }
    this._alpha = toPercentComponent(val, 'CSSHSL.alpha');
  }

  toString(): string {
    return `hsl(${this.h.toString()} ${this.s.toString()} ${this.l.toString()} / ${this.alpha.toString()})`;
  }
}
