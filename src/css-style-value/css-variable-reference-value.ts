import { type CSSUnparsedValue } from './css-unparsed-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssvariablereferencevalue
export class CSSVariableReferenceValue {
  constructor(public variable: string, public fallback: CSSUnparsedValue | null = null) {
    if (typeof variable !== 'string' || !variable.startsWith('--')) {
      throw new TypeError('CSSVariableReferenceValue variable must be a custom property name starting with "--"');
    }
  }
}

export type CSSUnparsedSegment = string | CSSVariableReferenceValue;
