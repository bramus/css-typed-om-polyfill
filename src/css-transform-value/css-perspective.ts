import { CSSTransformComponent } from './css-transform-component';
import { CSSNumericValue, matchesLength } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

export type CSSPerspectiveValue = CSSNumericValue | CSSKeywordValue;

// https://drafts.css-houdini.org/css-typed-om-1/#cssperspective
export class CSSPerspective extends CSSTransformComponent {
  private _length!: CSSPerspectiveValue;

  constructor(length: CSSPerspectiveValue) {
    super();
    this.length = length;
  }

  get length(): CSSPerspectiveValue { return this._length; }
  set length(val: CSSPerspectiveValue | string) {
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
    return `perspective(${this.length.toString()})`;
  }
}
