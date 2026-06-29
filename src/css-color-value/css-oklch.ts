import { CSSColorValue, toPercentComponent, toLCHHueComponent, type CSSColorPercent, type CSSColorAngle } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssoklch
export class CSSOKLCH extends CSSColorValue {
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

  get l(): CSSColorPercent { return this._l; }
  set l(val: CSSNumberish | CSSKeywordValue | string) {
    this._l = toPercentComponent(val, 'CSSOKLCH.l');
  }

  get c(): CSSColorPercent { return this._c; }
  set c(val: CSSNumberish | CSSKeywordValue | string) {
    this._c = toPercentComponent(val, 'CSSOKLCH.c');
  }

  get h(): CSSColorAngle { return this._h; }
  set h(val: CSSNumberish | CSSKeywordValue | string) {
    this._h = toLCHHueComponent(val);
  }

  get alpha(): CSSColorPercent { return this._alpha; }
  set alpha(val: CSSNumberish | CSSKeywordValue | string) {
    this._alpha = toPercentComponent(val, 'CSSOKLCH.alpha');
  }

  toString(): string {
    return `oklch(${this.l.toString()} ${this.c.toString()} ${this.h.toString()} / ${this.alpha.toString()})`;
  }
}
