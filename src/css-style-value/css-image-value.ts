import { CSSStyleValue } from './css-style-value';

export class CSSImageValue extends CSSStyleValue {
  constructor(public cssText?: string) {
    super();
  }

  get [Symbol.toStringTag]() {
    return 'CSSImageValue';
  }

  toString(): string {
    return this.cssText || '[object CSSImageValue]';
  }
}
