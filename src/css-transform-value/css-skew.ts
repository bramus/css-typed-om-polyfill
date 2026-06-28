import { CSSTransformComponent } from './css-transform-component';
import { CSSNumericValue, matchesAngle } from '../css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssskew
export class CSSSkew extends CSSTransformComponent {
  private _ax!: CSSNumericValue;
  private _ay!: CSSNumericValue;

  constructor(ax: CSSNumericValue, ay: CSSNumericValue) {
    super();
    this.ax = ax;
    this.ay = ay;
  }

  get ax(): CSSNumericValue { return this._ax; }
  set ax(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesAngle(val.type())) {
      throw new TypeError('CSSSkew.ax must be an angle');
    }
    this._ax = val;
  }

  get ay(): CSSNumericValue { return this._ay; }
  set ay(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesAngle(val.type())) {
      throw new TypeError('CSSSkew.ay must be an angle');
    }
    this._ay = val;
  }

  get is2D(): boolean {
    return true;
  }

  set is2D(value: boolean) {
    // Skew is always 2D
  }

  toMatrix(): DOMMatrix {
    const xDeg = this.ax.to('deg').value;
    const yDeg = this.ay.to('deg').value;
    const m = new DOMMatrix();
    m.b = Math.tan(yDeg * Math.PI / 180);
    m.c = Math.tan(xDeg * Math.PI / 180);
    return m;
  }

  toString(): string {
    return `skew(${this.ax.toString()}, ${this.ay.toString()})`;
  }
}
