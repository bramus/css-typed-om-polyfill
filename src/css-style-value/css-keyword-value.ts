import { CSSStyleValue } from './css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csskeywordvalue
export class CSSKeywordValue extends CSSStyleValue {
  private _value!: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  get value(): string {
    if (!(this instanceof CSSKeywordValue)) {
      throw new TypeError("Value of 'this' is not a CSSKeywordValue");
    }
    return this._value;
  }

  set value(val: string) {
    if (!(this instanceof CSSKeywordValue)) {
      throw new TypeError("Value of 'this' is not a CSSKeywordValue");
    }
    if (typeof val !== 'string' || val === '') {
      throw new TypeError('CSSKeywordValue value must be a non-empty string');
    }
    this._value = val;
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#serialize-a-csskeywordvalue
  toString(): string {
    // @NOTE: Deviating from spec: Using CSS.escape if available.
    // Spec says: "The serialization of a CSSKeywordValue is its value."
    // We escape it to ensure it is a valid identifier in the serialized output.
    if (typeof CSS !== 'undefined' && CSS.escape) {
      return CSS.escape(this.value);
    }
    return this.value;
  }
}
