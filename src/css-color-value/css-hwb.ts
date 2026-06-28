import { CSSColorValue, toColorComponent, type CSSColorPercent } from './css-color-value';
import { CSSNumericValue, type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csshwb
export class CSSHWB extends CSSColorValue {
  public h: CSSNumericValue;
  public w: CSSColorPercent;
  public b: CSSColorPercent;
  public alpha: CSSColorPercent;

  constructor(
    h: CSSNumericValue,
    w: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.h = h;
    this.w = toColorComponent(w);
    this.b = toColorComponent(b);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `hwb(${this.h.toString()} ${this.w.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}
