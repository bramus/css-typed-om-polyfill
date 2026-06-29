import { type CSSUnparsedValue } from './css-unparsed-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssvariablereferencevalue
export class CSSVariableReferenceValue {
  private _variable!: string;
  private _fallback!: CSSUnparsedValue | null;

  constructor(variable: string, fallback: CSSUnparsedValue | null = null) {
    this.variable = variable;
    this._fallback = fallback;
  }

  get variable(): string {
    if (!(this instanceof CSSVariableReferenceValue)) {
      throw new TypeError("Value of 'this' is not a CSSVariableReferenceValue");
    }
    return this._variable;
  }

  set variable(val: string) {
    if (!(this instanceof CSSVariableReferenceValue)) {
      throw new TypeError("Value of 'this' is not a CSSVariableReferenceValue");
    }
    if (typeof val !== 'string' || !val.startsWith('--')) {
      throw new TypeError('CSSVariableReferenceValue variable must be a custom property name starting with "--"');
    }
    this._variable = val;
  }

  get fallback(): CSSUnparsedValue | null {
    if (!(this instanceof CSSVariableReferenceValue)) {
      throw new TypeError("Value of 'this' is not a CSSVariableReferenceValue");
    }
    return this._fallback;
  }
}

export type CSSUnparsedSegment = string | CSSVariableReferenceValue;
