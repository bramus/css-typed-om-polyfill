import { CSSTransformComponent, isNumberValue } from './css-transform-component';
import { type CSSNumberish, toNumericValue } from '../css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssscale
export class CSSScale extends CSSTransformComponent {
  private _x!: CSSNumberish;
  private _y!: CSSNumberish;
  private _z!: CSSNumberish;
  private _is2D: boolean;

  constructor(x: CSSNumberish, y: CSSNumberish, z?: CSSNumberish) {
    super();
    this.x = x;
    this.y = y;
    if (z !== undefined) {
      this.z = z;
      this._is2D = false;
    } else {
      this._z = 1;
      this._is2D = true;
    }
  }

  get x(): CSSNumberish { return this._x; }
  set x(val: CSSNumberish) {
    if (!isNumberValue(val)) {
      throw new TypeError('CSSScale.x must be a number');
    }
    this._x = val;
  }

  get y(): CSSNumberish { return this._y; }
  set y(val: CSSNumberish) {
    if (!isNumberValue(val)) {
      throw new TypeError('CSSScale.y must be a number');
    }
    this._y = val;
  }

  get z(): CSSNumberish { return this._z; }
  set z(val: CSSNumberish) {
    if (!isNumberValue(val)) {
      throw new TypeError('CSSScale.z must be a number');
    }
    this._z = val;
  }

  get is2D(): boolean {
    return this._is2D;
  }

  set is2D(value: boolean) {
    this._is2D = value;
    if (value) {
      this._z = 1;
    }
  }

  toMatrix(): DOMMatrix {
    const xVal = toNumericValue(this.x).to('number').value;
    const yVal = toNumericValue(this.y).to('number').value;
    if (this.is2D) {
      return new DOMMatrix([xVal, 0, 0, yVal, 0, 0]);
    } else {
      const zVal = toNumericValue(this.z).to('number').value;
      const m = new DOMMatrix();
      m.scaleSelf(xVal, yVal, zVal);
      return m;
    }
  }

  toString(): string {
    if (this.is2D) {
      return `scale(${toNumericValue(this.x).toString()}, ${toNumericValue(this.y).toString()})`;
    }
    return `scale3d(${toNumericValue(this.x).toString()}, ${toNumericValue(this.y).toString()}, ${toNumericValue(this.z).toString()})`;
  }
}
