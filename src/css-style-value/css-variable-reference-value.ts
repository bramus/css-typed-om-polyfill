import { type CSSUnparsedValue } from './css-unparsed-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssvariablereferencevalue
export class CSSVariableReferenceValue {
  private _variable!: string;

  constructor(variable: string, public fallback: CSSUnparsedValue | null = null) {
    this.variable = variable;
  }

  get variable(): string {
    return this._variable;
  }

  set variable(val: string) {
    if (typeof val !== 'string' || !val.startsWith('--')) {
      throw new TypeError('CSSVariableReferenceValue variable must be a custom property name starting with "--"');
    }
    this._variable = val;
  }
}

export type CSSUnparsedSegment = string | CSSVariableReferenceValue;
