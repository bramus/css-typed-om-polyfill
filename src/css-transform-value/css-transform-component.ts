import { type CSSNumberish, matchesNumber } from '../css-numeric-value';

export class CSSTransformComponent {
  constructor() {
    if (this.constructor === CSSTransformComponent) {
      throw new TypeError('CSSTransformComponent cannot be directly constructed');
    }
  }

  get is2D(): boolean {
    if (!(this instanceof CSSTransformComponent)) {
      throw new TypeError("Value of 'this' is not a CSSTransformComponent");
    }
    throw new TypeError('Abstract property');
  }

  set is2D(val: boolean) {
    if (!(this instanceof CSSTransformComponent)) {
      throw new TypeError("Value of 'this' is not a CSSTransformComponent");
    }
    throw new TypeError('Abstract property');
  }

  toMatrix(): DOMMatrix {
    if (!(this instanceof CSSTransformComponent)) {
      throw new TypeError("Value of 'this' is not a CSSTransformComponent");
    }
    throw new TypeError('Abstract method');
  }

  toString(): string {
    if (!(this instanceof CSSTransformComponent)) {
      throw new TypeError("Value of 'this' is not a CSSTransformComponent");
    }
    throw new TypeError('Abstract method');
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}

export function isNumberValue(val: CSSNumberish): boolean {
  if (typeof val === 'number') return true;
  return matchesNumber(val.type());
}
