import { CSSColorValue, toHWBHueComponent, toPercentComponent, type CSSColorPercent } from './css-color-value';
import { CSSNumericValue, type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csshwb
export class CSSHWB extends CSSColorValue {
  private _h!: CSSNumericValue;
  private _w!: CSSColorPercent;
  private _b!: CSSColorPercent;
  private _alpha!: CSSColorPercent;

  constructor(
    h: CSSNumericValue,
    w: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.h = h;
    this.w = w;
    this.b = b;
    this.alpha = alpha;
  }

  get h(): CSSNumericValue { return this._h; }
  set h(val: CSSNumericValue) {
    this._h = toHWBHueComponent(val);
  }

  get w(): CSSColorPercent { return this._w; }
  set w(val: CSSNumberish | CSSKeywordValue | string) {
    this._w = toPercentComponent(val, 'CSSHWB.w');
  }

  get b(): CSSColorPercent { return this._b; }
  set b(val: CSSNumberish | CSSKeywordValue | string) {
    this._b = toPercentComponent(val, 'CSSHWB.b');
  }

  get alpha(): CSSColorPercent { return this._alpha; }
  set alpha(val: CSSNumberish | CSSKeywordValue | string) {
    this._alpha = toPercentComponent(val, 'CSSHWB.alpha');
  }

  toString(): string {
    return `hwb(${this.h.toString()} ${this.w.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}
