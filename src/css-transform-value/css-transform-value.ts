import { CSSStyleValue } from '../css-style-value';
import { CSSTransformComponent } from './css-transform-component';

// https://drafts.css-houdini.org/css-typed-om-1/#csstransformvalue
export class CSSTransformValue extends CSSStyleValue {
  private _components: CSSTransformComponent[];

  constructor(transforms: CSSTransformComponent[]) {
    super();
    if (!Array.isArray(transforms) || transforms.length === 0) {
      throw new TypeError('CSSTransformValue constructor requires a non-empty sequence of CSSTransformComponents');
    }
    this._components = [...transforms];
    return new Proxy(this, {
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
            if (index >= target._components.length) {
              throw new RangeError('Index out of range');
            }
            target._components[index] = value;
            return true;
          }
        }
        return Reflect.set(target, prop, value, receiver);
      }
    }) as any;
  }

  get length(): number {
    return this._components.length;
  }

  [index: number]: CSSTransformComponent;

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
