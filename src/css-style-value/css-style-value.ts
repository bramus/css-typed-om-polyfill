export type ParserFn = (property: string, cssText: string) => CSSStyleValue;
export type AllParserFn = (property: string, cssText: string) => CSSStyleValue[];

let parser: ParserFn | null = null;
let allParser: AllParserFn | null = null;

export function registerParsers(p: ParserFn, ap: AllParserFn) {
  parser = p;
  allParser = ap;
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssstylevalue
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
