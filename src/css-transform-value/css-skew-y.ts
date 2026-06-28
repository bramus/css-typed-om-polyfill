import { CSSTransformComponent } from './css-transform-component';
import { CSSNumericValue, matchesAngle } from '../css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssskewy
export class CSSSkewY extends CSSTransformComponent {
  private _ay: CSSNumericValue;

  constructor(ay: CSSNumericValue) {
    super();
    this.ay = ay;
  }

  get ay(): CSSNumericValue { return this._ay; }
  set ay(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesAngle(val.type())) {
      throw new TypeError('CSSSkewY.ay must be an angle');
    }
    this._ay = val;
  }

  get is2D(): boolean {
    return true;
  }

  set is2D(value: boolean) {
    // SkewY is always 2D
  }

  toMatrix(): DOMMatrix {
    const yDeg = this.ay.to('deg').value;
    const m = new DOMMatrix();
    m.b = Math.tan(yDeg * Math.PI / 180);
    return m;
  }

  toString(): string {
    return `skewY(${this.ay.toString()})`;
  }
}
