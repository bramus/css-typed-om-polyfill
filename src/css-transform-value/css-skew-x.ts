import { CSSTransformComponent } from './css-transform-component';
import { CSSNumericValue, matchesAngle } from '../css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssskewx
export class CSSSkewX extends CSSTransformComponent {
  private _ax!: CSSNumericValue;

  constructor(ax: CSSNumericValue) {
    super();
    this.ax = ax;
  }

  get ax(): CSSNumericValue { return this._ax; }
  set ax(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesAngle(val.type())) {
      throw new TypeError('CSSSkewX.ax must be an angle');
    }
    this._ax = val;
  }

  get is2D(): boolean {
    return true;
  }

  set is2D(value: boolean) {
    // SkewX is always 2D
  }

  toMatrix(): DOMMatrix {
    const xDeg = this.ax.to('deg').value;
    const m = new DOMMatrix();
    m.c = Math.tan(xDeg * Math.PI / 180);
    return m;
  }

  toString(): string {
    return `skewX(${this.ax.toString()})`;
  }
}
