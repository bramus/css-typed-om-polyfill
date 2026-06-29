import { CSSTransformComponent } from './css-transform-component';

export interface CSSMatrixComponentOptions {
  is2D?: boolean;
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssmatrixcomponent
export class CSSMatrixComponent extends CSSTransformComponent {
  private _matrix!: DOMMatrix;
  private _is2D!: boolean;

  constructor(matrix: DOMMatrixReadOnly, options?: CSSMatrixComponentOptions) {
    super();
    this.matrix = DOMMatrix.fromMatrix(matrix);
    let is2D: boolean | undefined = undefined;
    if (options && typeof options === 'object') {
      is2D = options.is2D;
    }
    this.is2D = typeof is2D === 'boolean' ? is2D : matrix.is2D;
  }

  get matrix(): DOMMatrix {
    if (!(this instanceof CSSMatrixComponent)) {
      throw new TypeError("Value of 'this' is not a CSSMatrixComponent");
    }
    return this._matrix;
  }

  set matrix(val: DOMMatrix) {
    if (!(this instanceof CSSMatrixComponent)) {
      throw new TypeError("Value of 'this' is not a CSSMatrixComponent");
    }
    if (!(val instanceof DOMMatrix)) {
      throw new TypeError('CSSMatrixComponent.matrix must be a DOMMatrix');
    }
    this._matrix = val;
  }

  get is2D(): boolean {
    if (!(this instanceof CSSMatrixComponent)) {
      throw new TypeError("Value of 'this' is not a CSSMatrixComponent");
    }
    return this._is2D;
  }

  set is2D(val: boolean) {
    if (!(this instanceof CSSMatrixComponent)) {
      throw new TypeError("Value of 'this' is not a CSSMatrixComponent");
    }
    this._is2D = val;
  }

  toMatrix(): DOMMatrix {
    if (this.is2D) {
      return new DOMMatrix([
        this.matrix.a,
        this.matrix.b,
        this.matrix.c,
        this.matrix.d,
        this.matrix.e,
        this.matrix.f
      ]);
    }
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
