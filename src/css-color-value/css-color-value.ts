import { CSSStyleValue, CSSKeywordValue } from '../css-style-value';
import { CSSNumericValue, toNumericValue, type CSSNumberish } from '../css-numeric-value';

export type CSSColorRGBComp = CSSNumericValue | CSSKeywordValue;
export type CSSColorPercent = CSSNumericValue | CSSKeywordValue;
export type CSSColorNumber = CSSNumericValue | CSSKeywordValue;
export type CSSColorAngle = CSSNumericValue | CSSKeywordValue;

let colorParser: ((cssText: string) => any) | null = null;

export function registerColorParser(cp: (cssText: string) => any) {
  colorParser = cp;
}

// https://drafts.css-houdini.org/css-typed-om-1/#csscolorvalue
export abstract class CSSColorValue extends CSSStyleValue {
  static parse(cssText: string): CSSColorValue | CSSStyleValue {
    if (!colorParser) {
      throw new Error('Color parser not registered. Make sure to import the index entry point.');
    }
    return colorParser(cssText);
  }
}

export function toColorComponent(val: CSSNumberish | CSSKeywordValue | string): CSSColorPercent {
  if (typeof val === 'string') {
    return new CSSKeywordValue(val);
  }
  if (val instanceof CSSKeywordValue) {
    return val;
  }
  return toNumericValue(val);
}
