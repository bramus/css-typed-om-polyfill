export type ParserFn = (property: string, cssText: string) => CSSStyleValue;
export type AllParserFn = (property: string, cssText: string) => CSSStyleValue[];

let parser: ParserFn | null = null;
let allParser: AllParserFn | null = null;

export function registerParsers(p: ParserFn, ap: AllParserFn) {
  parser = p;
  allParser = ap;
}

export abstract class CSSStyleValue {
  abstract toString(): string;

  static parse(property: string, cssText: string): CSSStyleValue {
    if (!parser) {
      throw new Error('CSS Typed OM parsers not registered. Make sure to import the index entry point.');
    }
    return parser(property, cssText);
  }

  static parseAll(property: string, cssText: string): CSSStyleValue[] {
    if (!allParser) {
      throw new Error('CSS Typed OM parsers not registered. Make sure to import the index entry point.');
    }
    return allParser(property, cssText);
  }
}

export class CSSKeywordValue extends CSSStyleValue {
  constructor(public value: string) {
    super();
    if (typeof value !== 'string' || value === '') {
      throw new TypeError('CSSKeywordValue value must be a non-empty string');
    }
  }

  toString(): string {
    return this.value;
  }
}

export class CSSVariableReferenceValue {
  constructor(public variable: string, public fallback: CSSUnparsedValue | null = null) {
    if (typeof variable !== 'string' || !variable.startsWith('--')) {
      throw new TypeError('CSSVariableReferenceValue variable must be a custom property name starting with "--"');
    }
  }
}

export type CSSUnparsedSegment = string | CSSVariableReferenceValue;

export class CSSUnparsedValue extends CSSStyleValue {
  private _segments: CSSUnparsedSegment[];

  constructor(members: CSSUnparsedSegment[]) {
    super();
    this._segments = [...members];
  }

  get length(): number {
    return this._segments.length;
  }

  // Support array-like indexed access using getters/setters if possible,
  // but in JS we can also define them on the instance or prototype.
  // For TypeScript compatibility, we implement a getter method or index signature.
  [index: number]: CSSUnparsedSegment;

  // We can use a Proxy or define property getters for numeric indices.
  // A simple way in TypeScript/JS is to return a Proxy from the constructor.
  // Let's do that so that `val[0]` works exactly like a native array!
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
            target._segments[index] = value;
            return true;
          }
        }
        return Reflect.set(target, prop, value, receiver);
      }
    }) as any;
  }

  // Implement iterable protocol
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

export class CSSImageValue extends CSSStyleValue {
  // Base class for image values. Currently has no additional properties.
  toString(): string {
    return '[object CSSImageValue]';
  }
}
