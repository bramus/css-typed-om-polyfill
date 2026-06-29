import { CSSTransformComponent } from './css-transform-component';
import { CSSNumericValue, CSSUnitValue, matchesLength } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

export type CSSPerspectiveValue = CSSNumericValue | CSSKeywordValue;

// https://drafts.css-houdini.org/css-typed-om-1/#cssperspective
export class CSSPerspective extends CSSTransformComponent {
  private _length!: CSSPerspectiveValue;

  constructor(length: CSSPerspectiveValue) {
    super();
    this.length = length;
  }

  get length(): CSSPerspectiveValue {
    if (!(this instanceof CSSPerspective)) {
      throw new TypeError("Value of 'this' is not a CSSPerspective");
    }
    return this._length;
  }
  set length(val: CSSPerspectiveValue | string) {
    if (!(this instanceof CSSPerspective)) {
      throw new TypeError("Value of 'this' is not a CSSPerspective");
    }
    let resolvedVal: CSSPerspectiveValue;
    if (typeof val === 'string') {
      if (val.toLowerCase() === 'none') {
        resolvedVal = new CSSKeywordValue('none');
      } else {
        throw new TypeError('CSSPerspective length must be a length or "none"');
      }
    } else {
      resolvedVal = val;
    }

    if (resolvedVal instanceof CSSKeywordValue) {
      if (resolvedVal.value !== 'none') {
        throw new TypeError("CSSPerspective length keyword must be 'none'");
      }
    } else if (resolvedVal instanceof CSSNumericValue) {
      if (!matchesLength(resolvedVal.type())) {
        throw new TypeError('CSSPerspective length must be a length');
      }
    } else {
      throw new TypeError('CSSPerspective length must be a length or "none"');
    }
    this._length = resolvedVal;
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
      return m;
    }
    const valPx = this.length.to('px').value;
    if (valPx !== 0) {
      m.m34 = -1 / valPx;
    }
    return m;
  }

  toString(): string {
    if (this.length instanceof CSSNumericValue) {
      const min = new CSSUnitValue(0, 'px');
      return `perspective(${this.length._serialize(false, false, min)})`;
    }
    return `perspective(${this.length.toString()})`;
  }
}
