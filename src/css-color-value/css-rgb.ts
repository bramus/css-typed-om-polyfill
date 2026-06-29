import { CSSColorValue, toRGBComponent, toPercentComponent, type CSSColorRGBComp, type CSSColorPercent } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
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

  get r(): CSSColorRGBComp { return this._r; }
  set r(val: CSSNumberish | CSSKeywordValue | string) {
    this._r = toRGBComponent(val, 'CSSRGB.r');
  }

  get g(): CSSColorRGBComp { return this._g; }
  set g(val: CSSNumberish | CSSKeywordValue | string) {
    this._g = toRGBComponent(val, 'CSSRGB.g');
  }

  get b(): CSSColorRGBComp { return this._b; }
  set b(val: CSSNumberish | CSSKeywordValue | string) {
    this._b = toRGBComponent(val, 'CSSRGB.b');
  }

  get alpha(): CSSColorPercent { return this._alpha; }
  set alpha(val: CSSNumberish | CSSKeywordValue | string) {
    this._alpha = toPercentComponent(val, 'CSSRGB.alpha');
  }

  toString(): string {
    return `color(srgb ${this.r.toString()} ${this.g.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}
