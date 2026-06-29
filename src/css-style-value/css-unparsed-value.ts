import { CSSStyleValue } from './css-style-value';
import { type CSSUnparsedSegment } from './css-variable-reference-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssunparsedvalue
export class CSSUnparsedValue extends CSSStyleValue {
  private _segments: CSSUnparsedSegment[];

  constructor(members: CSSUnparsedSegment[]) {
    super();
    this._segments = [...members];
    return new Proxy(this, {
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
            if (index > target._segments.length) {
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

  get length(): number {
    return this._segments.length;
  }

  [index: number]: CSSUnparsedSegment;

  *[Symbol.iterator](): Iterator<CSSUnparsedSegment> {
    for (const segment of this._segments) {
      yield segment;
    }
  }

  toString(): string {
    const serializedSegments = this._segments.map(segment => {
      if (typeof segment === 'string') {
        return segment;
      } else {
        const fallbackStr = segment.fallback ? `,${segment.fallback.toString()}` : '';
        return `var(${segment.variable}${fallbackStr})`;
      }
    });

    if (serializedSegments.length === 0) {
      return '';
    }

    let result = serializedSegments[0]!;
    for (let i = 1; i < serializedSegments.length; i++) {
      const next = serializedSegments[i]!;
      if (result === '' || next === '') {
        result += next;
        continue;
      }
      const lastChar = result[result.length - 1]!;
      const firstChar = next[0]!;
      if (/[\w-]/.test(lastChar) && /[\w-]/.test(firstChar)) {
        result += '/**/';
      }
      result += next;
    }
    return result;
  }
}
