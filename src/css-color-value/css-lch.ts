import { CSSColorValue, toColorComponent, type CSSColorPercent, type CSSColorAngle } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csslch
export class CSSLCH extends CSSColorValue {
  public l: CSSColorPercent;
  public c: CSSColorPercent;
  public h: CSSColorAngle;
  public alpha: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    c: CSSNumberish | CSSKeywordValue | string,
    h: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = toColorComponent(l);
    this.c = toColorComponent(c);
    this.h = toColorComponent(h);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `lch(${this.l.toString()} ${this.c.toString()} ${this.h.toString()} / ${this.alpha.toString()})`;
  }
}
