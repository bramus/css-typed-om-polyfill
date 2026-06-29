import { CSSStyleValue } from './css-style-value';

export class CSSImageValue extends CSSStyleValue {
  constructor(cssText?: string) {
    super(cssText);
  }

  get [Symbol.toStringTag]() {
    return 'CSSImageValue';
  }

  toString(): string {
    return this.cssText || '[object CSSImageValue]';
  }
}
