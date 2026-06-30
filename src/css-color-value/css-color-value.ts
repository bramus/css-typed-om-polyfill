import { CSSStyleValue, CSSKeywordValue } from '../css-style-value';
import { CSSNumericValue, toNumericValue, type CSSNumberish, CSSUnitValue, matchesPercentage, matchesAngle, matchesNumber } from '../css-numeric-value';

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
  constructor() {
    super();
    if (this.constructor === CSSColorValue) {
      throw new TypeError('CSSColorValue cannot be directly constructed');
    }
  }

  static parse(cssText: string): CSSColorValue | CSSStyleValue {
    if (arguments.length < 1) {
      throw new TypeError(`Failed to execute 'parse' on 'CSSColorValue': 1 argument required, but only ${arguments.length} present.`);
    }
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

function toColorComponentHelper(
  val: any,
  name: string,
  typeCheck: (val: CSSNumericValue) => boolean,
  typeErrorMsg: string,
  convertNumber: (val: number) => CSSNumericValue,
  allowedKeywords: string[] = ['none']
): CSSNumericValue | CSSKeywordValue {
  if (val === undefined) {
    if (allowedKeywords.includes('undefined')) {
      return new CSSKeywordValue('undefined');
    }
    throw new DOMException(`${name} cannot be undefined`, 'SyntaxError');
  }
  if (typeof val === 'string') {
    try {
      const parsed = CSSNumericValue.parse(val);
      if (!typeCheck(parsed)) {
        throw new DOMException(`${name} ${typeErrorMsg}`, 'SyntaxError');
      }
      return parsed;
    } catch (e) {
      const lower = val.toLowerCase();
      if (allowedKeywords.includes(lower)) {
        return new CSSKeywordValue(lower);
      }
      if (e instanceof DOMException && e.name === 'SyntaxError') {
        throw e;
      }
      throw new DOMException(`Invalid string for ${name}: ${val}`, 'SyntaxError');
    }
  }
  if (val instanceof CSSKeywordValue) {
    return val;
  }
  if (typeof val === 'number') {
    return convertNumber(val);
  }
  if (val instanceof CSSNumericValue) {
    if (!typeCheck(val)) {
      throw new DOMException(`${name} ${typeErrorMsg}`, 'SyntaxError');
    }
    return val;
  }
  throw new DOMException(`Invalid value for ${name}`, 'SyntaxError');
}

export function toPercentComponent(val: any, name: string): CSSNumericValue | CSSKeywordValue {
  return toColorComponentHelper(
    val,
    name,
    (v) => matchesPercentage(v.type()),
    'must be a percent',
    (v) => new CSSUnitValue(v * 100, 'percent')
  );
}

export function toRGBComponent(val: any, name: string): CSSNumericValue | CSSKeywordValue {
  return toColorComponentHelper(
    val,
    name,
    (v) => matchesPercentage(v.type()) || matchesNumber(v.type()),
    'must be a number or percent',
    (v) => new CSSUnitValue(v * 100, 'percent')
  );
}

export function toHSLHueComponent(val: any): CSSNumericValue | CSSKeywordValue {
  return toColorComponentHelper(
    val,
    'CSSHSL.h',
    (v) => matchesAngle(v.type()) || matchesNumber(v.type()),
    'must be an angle or a number',
    (v) => new CSSUnitValue(v, 'deg'),
    ['none', 'undefined']
  );
}

export function toHWBHueComponent(val: any): CSSNumericValue {
  if (val === undefined || typeof val === 'number' || typeof val === 'string' || val instanceof CSSKeywordValue) {
    throw new TypeError('CSSHWB.h must be a CSSNumericValue');
  }
  if (!(val instanceof CSSNumericValue)) {
    throw new TypeError('CSSHWB.h must be a CSSNumericValue');
  }
  if (!matchesAngle(val.type())) {
    throw new DOMException('CSSHWB.h must be an angle', 'SyntaxError');
  }
  return val;
}

export function toLabColorComponent(val: any, name: string): CSSNumericValue | CSSKeywordValue {
  return toColorComponentHelper(
    val,
    name,
    (v) => matchesPercentage(v.type()) || matchesNumber(v.type()),
    'must be a number or percent',
    (v) => new CSSUnitValue(v, 'number')
  );
}

export function toLCHHueComponent(val: any): CSSNumericValue | CSSKeywordValue {
  return toColorComponentHelper(
    val,
    'CSSLCH.h',
    (v) => matchesAngle(v.type()),
    'must be an angle',
    (v) => new CSSUnitValue(v, 'deg')
  );
}

