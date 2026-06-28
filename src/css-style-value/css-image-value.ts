import { CSSStyleValue } from './css-style-value';

export class CSSImageValue extends CSSStyleValue {
  toString(): string {
    return '[object CSSImageValue]';
  }
}
