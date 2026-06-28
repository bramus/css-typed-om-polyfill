import { CSSTransformComponent } from './css-transform-component';
import { CSSNumericValue, CSSUnitValue, matchesLengthPercentage, matchesLength } from '../css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csstranslate
export class CSSTranslate extends CSSTransformComponent {
  private _x: CSSNumericValue;
  private _y: CSSNumericValue;
  private _z: CSSNumericValue;
  private _is2D: boolean;

  constructor(x: CSSNumericValue, y: CSSNumericValue, z?: CSSNumericValue) {
    super();
    this.x = x;
    this.y = y;
    if (z !== undefined) {
      this.z = z;
      this._is2D = false;
    } else {
      this._z = new CSSUnitValue(0, 'px');
      this._is2D = true;
    }
  }

  get x(): CSSNumericValue { return this._x; }
  set x(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesLengthPercentage(val.type())) {
      throw new TypeError('CSSTranslate.x must be a length or percentage');
    }
    this._x = val;
  }

  get y(): CSSNumericValue { return this._y; }
  set y(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesLengthPercentage(val.type())) {
      throw new TypeError('CSSTranslate.y must be a length or percentage');
    }
    this._y = val;
  }

  get z(): CSSNumericValue { return this._z; }
  set z(val: CSSNumericValue) {
    if (!(val instanceof CSSNumericValue) || !matchesLength(val.type())) {
      throw new TypeError('CSSTranslate.z must be a length');
    }
    this._z = val;
  }

  get is2D(): boolean {
    return this._is2D;
  }

  set is2D(value: boolean) {
    this._is2D = value;
    if (value) {
      this._z = new CSSUnitValue(0, 'px');
    }
  }

  toMatrix(): DOMMatrix {
    if (this.is2D) {
      const xPx = this.x.to('px').value;
      const yPx = this.y.to('px').value;
      return new DOMMatrix([1, 0, 0, 1, xPx, yPx]);
    } else {
      const xPx = this.x.to('px').value;
      const yPx = this.y.to('px').value;
      const zPx = this.z.to('px').value;
      const m = new DOMMatrix();
      m.translateSelf(xPx, yPx, zPx);
      return m;
    }
  }

  toString(): string {
    if (this.is2D) {
      return `translate(${this.x.toString()}, ${this.y.toString()})`;
    }
    return `translate3d(${this.x.toString()}, ${this.y.toString()}, ${this.z.toString()})`;
  }
}
