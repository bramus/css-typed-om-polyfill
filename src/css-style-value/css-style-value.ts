export type ParserFn = (property: string, cssText: string) => CSSStyleValue;
export type AllParserFn = (property: string, cssText: string) => CSSStyleValue[];

let parser: ParserFn | null = null;
let allParser: AllParserFn | null = null;

export function registerParsers(p: ParserFn, ap: AllParserFn) {
  parser = p;
  allParser = ap;
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssstylevalue
export class CSSStyleValue {
  constructor(protected cssText?: string, token?: any) {
    if (token !== Symbol.for('css-typed-om-polyfill-private-token') && this.constructor === CSSStyleValue) {
      throw new TypeError('Illegal constructor');
    }
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }

  toString(): string {
    if (!(this instanceof CSSStyleValue)) {
      throw new TypeError("Value of 'this' is not a CSSStyleValue");
    }
    return this.cssText || '';
  }

  static parse(property: string, cssText: string): CSSStyleValue {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to execute 'parse' on 'CSSStyleValue': 2 arguments required, but only ${arguments.length} present.`);
    }
    if (!parser) {
      throw new Error('CSS Typed OM parsers not registered. Make sure to import the index entry point.');
    }
    return parser(property, cssText);
  }

  static parseAll(property: string, cssText: string): CSSStyleValue[] {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to execute 'parseAll' on 'CSSStyleValue': 2 arguments required, but only ${arguments.length} present.`);
    }
    if (!allParser) {
      throw new Error('CSS Typed OM parsers not registered. Make sure to import the index entry point.');
    }
    return allParser(property, cssText);
  }
}
