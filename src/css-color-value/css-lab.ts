import { CSSColorValue, toPercentComponent, toLabColorComponent, type CSSColorPercent, type CSSColorNumber } from './css-color-value';
import { type CSSNumberish } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csslab
export class CSSLab extends CSSColorValue {
  private _l!: CSSColorPercent;
  private _a!: CSSColorNumber;
  private _b!: CSSColorNumber;
  private _alpha!: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    a: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = l;
    this.a = a;
    this.b = b;
    this.alpha = alpha;
  }

  get l(): CSSColorPercent { return this._l; }
  set l(val: CSSNumberish | CSSKeywordValue | string) {
    this._l = toPercentComponent(val, 'CSSLab.l');
  }

  get a(): CSSColorNumber { return this._a; }
  set a(val: CSSNumberish | CSSKeywordValue | string) {
    this._a = toLabColorComponent(val, 'CSSLab.a');
  }

  get b(): CSSColorNumber { return this._b; }
  set b(val: CSSNumberish | CSSKeywordValue | string) {
    this._b = toLabColorComponent(val, 'CSSLab.b');
  }

  get alpha(): CSSColorPercent { return this._alpha; }
  set alpha(val: CSSNumberish | CSSKeywordValue | string) {
    this._alpha = toPercentComponent(val, 'CSSLab.alpha');
  }

  toString(): string {
    return `lab(${this.l.toString()} ${this.a.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}
