import { CSSTransformComponent, isNumberValue } from './css-transform-component';
import { CSSNumericValue, type CSSNumberish, toNumericValue, matchesAngle } from '../css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssrotate
export class CSSRotate extends CSSTransformComponent {
  private _x!: CSSNumberish;
  private _y!: CSSNumberish;
  private _z!: CSSNumberish;
  private _angle!: CSSNumericValue;
  private _is2D: boolean;

  constructor(angle: CSSNumericValue);
  constructor(x: CSSNumberish, y: CSSNumberish, z: CSSNumberish, angle: CSSNumericValue);
  constructor(
    a: CSSNumberish | CSSNumericValue,
    b?: CSSNumberish,
    c?: CSSNumberish,
    d?: CSSNumericValue
  ) {
    super();
    if (typeof b === 'undefined') {
      this.angle = a as CSSNumericValue;
      this._x = 0;
      this._y = 0;
      this._z = 1;
      this._is2D = true;
    } else {
      this.x = a;
      this.y = b;
      this.z = c!;
      this.angle = d!;
      this._is2D = false;
    }
  }

  get x(): CSSNumberish { return this._x; }
  set x(val: CSSNumberish) {
    if (!isNumberValue(val)) {
      throw new TypeError('CSSRotate.x must be a number');
    }
    this._x = toNumericValue(val);
  }

  get y(): CSSNumberish { return this._y; }
  set y(val: CSSNumberish) {
    if (!isNumberValue(val)) {
      throw new TypeError('CSSRotate.y must be a number');
    }
    this._y = toNumericValue(val);
  }

  get z(): CSSNumberish { return this._z; }
  set z(val: CSSNumberish) {
    if (!isNumberValue(val)) {
      throw new TypeError('CSSRotate.z must be a number');
    }
    this._z = toNumericValue(val);
  }

  get angle(): CSSNumericValue { return this._angle; }
  set angle(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesAngle(val.type())) {
      throw new TypeError('CSSRotate.angle must be an angle');
    }
    this._angle = val;
  }

  get is2D(): boolean {
    return this._is2D;
  }

  set is2D(value: boolean) {
    this._is2D = value;
    if (value) {
      this._x = 0;
      this._y = 0;
      this._z = 1;
    }
  }

  toMatrix(): DOMMatrix {
    const angleDeg = this.angle.to('deg').value;
    if (this.is2D) {
      const m = new DOMMatrix();
      m.rotateSelf(angleDeg);
      return m;
    } else {
      const xVal = toNumericValue(this.x).to('number').value;
      const yVal = toNumericValue(this.y).to('number').value;
      const zVal = toNumericValue(this.z).to('number').value;
      const m = new DOMMatrix();
      m.rotateAxisAngleSelf(xVal, yVal, zVal, angleDeg);
      return m;
    }
  }

  toString(): string {
    if (this.is2D) {
      return `rotate(${this.angle.toString()})`;
    }
    const xStr = toNumericValue(this.x).toString();
    const yStr = toNumericValue(this.y).toString();
    const zStr = toNumericValue(this.z).toString();
    return `rotate3d(${xStr}, ${yStr}, ${zStr}, ${this.angle.toString()})`;
  }
}
