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

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-cssunparsedvalue
  toString(): string {
    // 1. Let result be the empty string.
    // 2. For each segment in this's associated list of segments:
    const serializedSegments = this._segments.map(segment => {
      if (typeof segment === 'string') {
        // 1. If segment is a string, append segment to result.
        return segment;
      } else {
        // 2. If segment is a CSSVariableReferenceValue:
        //    1. Append "var(" to result.
        //    2. Append segment's variable to result.
        //    3. If segment has a fallback:
        //       1. Append "," to result.
        //       2. Append the serialization of segment's fallback to result.
        //    4. Append ")" to result.
        const fallbackStr = segment.fallback ? `,${segment.fallback.toString()}` : '';
        return `var(${segment.variable}${fallbackStr})`;
      }
    });

    if (serializedSegments.length === 0) {
      return '';
    }

    let result = serializedSegments[0]!;
    // @NOTE: Deviating from spec: Inserting '/**/' between segments that end/start
    // with identifier characters to prevent them from merging into a single token.
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
    // 3. Return result.
    return result;
  }
}
