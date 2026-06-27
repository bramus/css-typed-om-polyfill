import { CSSStyleValue, CSSKeywordValue } from './css-style-value';
import { CSSNumericValue, type CSSNumberish, toNumericValue, CSSUnitValue } from './css-numeric-value';

export abstract class CSSTransformComponent {
  abstract is2D: boolean;
  abstract toMatrix(): DOMMatrix;
  abstract toString(): string;
}

export class CSSTransformValue extends CSSStyleValue {
  private _components: CSSTransformComponent[];

  constructor(transforms: CSSTransformComponent[]) {
    super();
    if (!Array.isArray(transforms) || transforms.length === 0) {
      throw new TypeError('CSSTransformValue constructor requires a non-empty sequence of CSSTransformComponents');
    }
    this._components = [...transforms];
  }

  get length(): number {
    return this._components.length;
  }

  [index: number]: CSSTransformComponent;

  static create(transforms: CSSTransformComponent[]): CSSTransformValue {
    const instance = new CSSTransformValue(transforms);
    return new Proxy(instance, {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          const index = Number(prop);
          if (Number.isInteger(index) && index >= 0 && index < target._components.length) {
            return target._components[index];
          }
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value, receiver) {
        if (typeof prop === 'string') {
          const index = Number(prop);
          if (Number.isInteger(index) && index >= 0) {
            target._components[index] = value;
            return true;
          }
        }
        return Reflect.set(target, prop, value, receiver);
      }
    }) as any;
  }

  get is2D(): boolean {
    return this._components.every(comp => comp.is2D);
  }

  toMatrix(): DOMMatrix {
    let matrix = new DOMMatrix();
    for (const comp of this._components) {
      matrix.multiplySelf(comp.toMatrix());
    }
    return matrix;
  }

  *[Symbol.iterator](): Iterator<CSSTransformComponent> {
    for (const comp of this._components) {
      yield comp;
    }
  }

  toString(): string {
    return this._components.map(comp => comp.toString()).join(' ');
  }
}

export class CSSTranslate extends CSSTransformComponent {
  public x: CSSNumericValue;
  public y: CSSNumericValue;
  public z: CSSNumericValue;

  constructor(x: CSSNumericValue, y: CSSNumericValue, z: CSSNumericValue = new CSSUnitValue(0, 'px')) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }

  get is2D(): boolean {
    return this.z instanceof CSSUnitValue && this.z.value === 0;
  }

  set is2D(value: boolean) {
    if (value) {
      this.z = new CSSUnitValue(0, 'px');
    }
  }

  toMatrix(): DOMMatrix {
    if (this.is2D) {
      // We need to resolve px values. If they are not px, we might need a layout context,
      // but standard Typed OM toMatrix() assumes px or resolves them as 0 if relative.
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

export class CSSRotate extends CSSTransformComponent {
  public x: CSSNumberish;
  public y: CSSNumberish;
  public z: CSSNumberish;
  public angle: CSSNumericValue;

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
      this.x = 0;
      this.y = 0;
      this.z = 1;
      this.angle = a as CSSNumericValue;
    } else {
      this.x = a;
      this.y = b;
      this.z = c!;
      this.angle = d!;
    }
  }

  get is2D(): boolean {
    // 2D rotation is around the Z axis only (x=0, y=0, z=1)
    const xNum = toNumericValue(this.x);
    const yNum = toNumericValue(this.y);
    const zNum = toNumericValue(this.z);
    return xNum instanceof CSSUnitValue && xNum.value === 0 &&
           yNum instanceof CSSUnitValue && yNum.value === 0 &&
           zNum instanceof CSSUnitValue && zNum.value === 1;
  }

  set is2D(value: boolean) {
    if (value) {
      this.x = 0;
      this.y = 0;
      this.z = 1;
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

export class CSSScale extends CSSTransformComponent {
  public x: CSSNumberish;
  public y: CSSNumberish;
  public z: CSSNumberish;

  constructor(x: CSSNumberish, y: CSSNumberish, z: CSSNumberish = 1) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }

  get is2D(): boolean {
    const zNum = toNumericValue(this.z);
    return zNum instanceof CSSUnitValue && zNum.value === 1;
  }

  set is2D(value: boolean) {
    if (value) {
      this.z = 1;
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

export class CSSSkew extends CSSTransformComponent {
  public ax: CSSNumericValue;
  public ay: CSSNumericValue;

  constructor(ax: CSSNumericValue, ay: CSSNumericValue) {
    super();
    this.ax = ax;
    this.ay = ay;
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
    // Skewing is done by setting the shear components
    // tan(ax) and tan(ay)
    m.b = Math.tan(yDeg * Math.PI / 180);
    m.c = Math.tan(xDeg * Math.PI / 180);
    return m;
  }

  toString(): string {
    return `skew(${this.ax.toString()}, ${this.ay.toString()})`;
  }
}

export class CSSSkewX extends CSSTransformComponent {
  public ax: CSSNumericValue;

  constructor(ax: CSSNumericValue) {
    super();
    this.ax = ax;
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

export class CSSSkewY extends CSSTransformComponent {
  public ay: CSSNumericValue;

  constructor(ay: CSSNumericValue) {
    super();
    this.ay = ay;
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

export type CSSPerspectiveValue = CSSNumericValue | CSSKeywordValue;

export class CSSPerspective extends CSSTransformComponent {
  public length: CSSPerspectiveValue;

  constructor(length: CSSPerspectiveValue) {
    super();
    this.length = length;
    if (length instanceof CSSKeywordValue && length.value !== 'none') {
      throw new TypeError("CSSPerspective length keyword must be 'none'");
    }
  }

  get is2D(): boolean {
    return false;
  }

  set is2D(value: boolean) {
    // Perspective is always 3D
  }

  toMatrix(): DOMMatrix {
    const m = new DOMMatrix();
    if (this.length instanceof CSSKeywordValue) {
      return m; // Identity matrix
    }
    const valPx = this.length.to('px').value;
    if (valPx !== 0) {
      m.m34 = -1 / valPx;
    }
    return m;
  }

  toString(): string {
    return `perspective(${this.length.toString()})`;
  }
}

export interface CSSMatrixComponentOptions {
  is2D?: boolean;
}

export class CSSMatrixComponent extends CSSTransformComponent {
  public matrix: DOMMatrix;
  public is2D: boolean;

  constructor(matrix: DOMMatrixReadOnly, options: CSSMatrixComponentOptions = {}) {
    super();
    this.matrix = DOMMatrix.fromMatrix(matrix);
    this.is2D = typeof options.is2D === 'boolean' ? options.is2D : matrix.is2D;
  }

  toMatrix(): DOMMatrix {
    return DOMMatrix.fromMatrix(this.matrix);
  }

  toString(): string {
    if (this.is2D) {
      return `matrix(${this.matrix.a}, ${this.matrix.b}, ${this.matrix.c}, ${this.matrix.d}, ${this.matrix.e}, ${this.matrix.f})`;
    }
    return `matrix3d(${this.matrix.m11}, ${this.matrix.m12}, ${this.matrix.m13}, ${this.matrix.m14}, ` +
      `${this.matrix.m21}, ${this.matrix.m22}, ${this.matrix.m23}, ${this.matrix.m24}, ` +
      `${this.matrix.m31}, ${this.matrix.m32}, ${this.matrix.m33}, ${this.matrix.m34}, ` +
      `${this.matrix.m41}, ${this.matrix.m42}, ${this.matrix.m43}, ${this.matrix.m44})`;
  }
}
