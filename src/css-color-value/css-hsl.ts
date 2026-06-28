import { CSSColorValue, toColorComponent, type CSSColorAngle, type CSSColorPercent } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csshsl
export class CSSHSL extends CSSColorValue {
  public h: CSSColorAngle;
  public s: CSSColorPercent;
  public l: CSSColorPercent;
  public alpha: CSSColorPercent;

  constructor(
    h: CSSNumberish | CSSKeywordValue | string,
    s: CSSNumberish | CSSKeywordValue | string,
    l: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.h = toColorComponent(h);
    this.s = toColorComponent(s);
    this.l = toColorComponent(l);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `hsl(${this.h.toString()} ${this.s.toString()} ${this.l.toString()} / ${this.alpha.toString()})`;
  }
}
