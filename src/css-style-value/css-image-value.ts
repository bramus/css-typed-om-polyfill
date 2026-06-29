import { CSSStyleValue } from './css-style-value';

export class CSSImageValue extends CSSStyleValue {
  constructor(cssText?: string, token?: any) {
    super(cssText, token);
    if (token !== Symbol.for('css-typed-om-polyfill-private-token') && this.constructor === CSSImageValue) {
      throw new TypeError('Illegal constructor');
    }
  }

  get [Symbol.toStringTag]() {
    return 'CSSImageValue';
  }

  toString(): string {
    return this.cssText || '[object CSSImageValue]';
  }
}
