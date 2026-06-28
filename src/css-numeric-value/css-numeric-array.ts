import { CSSNumericValue } from './css-numeric-value';

export class CSSNumericArray {
  private _values: CSSNumericValue[];

  constructor(values: CSSNumericValue[]) {
    this._values = [...values];
  }

  get length(): number {
    return this._values.length;
  }

  [index: number]: CSSNumericValue;

  static create(values: CSSNumericValue[]): CSSNumericArray {
    const instance = new CSSNumericArray(values);
    return new Proxy(instance, {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          const index = Number(prop);
          if (Number.isInteger(index) && index >= 0 && index < target._values.length) {
            return target._values[index];
          }
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as any;
  }

  *[Symbol.iterator](): IterableIterator<CSSNumericValue> {
    for (const val of this._values) {
      yield val;
    }
  }

  forEach(callbackfn: (value: CSSNumericValue, key: number, parent: CSSNumericArray) => void, thisArg?: any): void {
    this._values.forEach((val, index) => callbackfn.call(thisArg, val, index, this));
  }

  entries(): IterableIterator<[number, CSSNumericValue]> {
    return this._values.entries();
  }

  keys(): IterableIterator<number> {
    return this._values.keys();
  }

  values(): IterableIterator<CSSNumericValue> {
    return this._values.values();
  }
}
