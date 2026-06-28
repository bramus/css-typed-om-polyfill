import { CSSColorValue, toColorComponent, type CSSColorPercent, type CSSColorNumber } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csslab
export class CSSLab extends CSSColorValue {
  public l: CSSColorPercent;
  public a: CSSColorNumber;
  public b: CSSColorNumber;
  public alpha: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    a: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = toColorComponent(l);
    this.a = toColorComponent(a);
    this.b = toColorComponent(b);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `lab(${this.l.toString()} ${this.a.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}
