import { CSSStyleValue } from './css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csskeywordvalue
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
