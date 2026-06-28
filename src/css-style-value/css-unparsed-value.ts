import { CSSStyleValue } from './css-style-value';
import { type CSSUnparsedSegment } from './css-variable-reference-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssunparsedvalue
export class CSSUnparsedValue extends CSSStyleValue {
  private _segments: CSSUnparsedSegment[];

  constructor(members: CSSUnparsedSegment[]) {
    super();
    this._segments = [...members];
  }

  get length(): number {
    return this._segments.length;
  }

  [index: number]: CSSUnparsedSegment;

  static create(members: CSSUnparsedSegment[]): CSSUnparsedValue {
    const instance = new CSSUnparsedValue(members);
    return new Proxy(instance, {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          const index = Number(prop);
          if (Number.isInteger(index) && index >= 0 && index < target._segments.length) {
            return target._segments[index];
          }
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value, receiver) {
        if (typeof prop === 'string') {
          const index = Number(prop);
          if (Number.isInteger(index) && index >= 0) {
            if (index >= target._segments.length) {
              throw new RangeError('Index out of range');
            }
            target._segments[index] = value;
            return true;
          }
        }
        return Reflect.set(target, prop, value, receiver);
      }
    }) as any;
  }

  *[Symbol.iterator](): Iterator<CSSUnparsedSegment> {
    for (const segment of this._segments) {
      yield segment;
    }
  }

  toString(): string {
    return this._segments.map(segment => {
      if (typeof segment === 'string') {
        return segment;
      } else {
        const fallbackStr = segment.fallback ? `, ${segment.fallback.toString()}` : '';
        return `var(${segment.variable}${fallbackStr})`;
      }
    }).join('');
  }
}
