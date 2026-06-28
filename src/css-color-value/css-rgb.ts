import { CSSColorValue, toColorComponent, type CSSColorRGBComp, type CSSColorPercent } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssrgb
export class CSSRGB extends CSSColorValue {
  public r: CSSColorRGBComp;
  public g: CSSColorRGBComp;
  public b: CSSColorRGBComp;
  public alpha: CSSColorPercent;

  constructor(
    r: CSSNumberish | CSSKeywordValue | string,
    g: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.r = toColorComponent(r);
    this.g = toColorComponent(g);
    this.b = toColorComponent(b);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `color(srgb ${this.r.toString()} ${this.g.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}
