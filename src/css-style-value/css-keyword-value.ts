import { CSSStyleValue } from './css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csskeywordvalue
export class CSSKeywordValue extends CSSStyleValue {
  private _value!: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    if (typeof val !== 'string' || val === '') {
      throw new TypeError('CSSKeywordValue value must be a non-empty string');
    }
    this._value = val;
  }

  toString(): string {
    return this.value;
  }
}
