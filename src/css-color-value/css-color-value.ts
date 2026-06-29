import { CSSStyleValue, CSSKeywordValue } from '../css-style-value';
import { CSSNumericValue, toNumericValue, type CSSNumberish, CSSUnitValue } from '../css-numeric-value';

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

function isPercentValue(val: CSSNumericValue): boolean {
  const type = val.type();
  if (type.percent !== 1) return false;
  for (const [key, value] of Object.entries(type)) {
    if (key !== 'percent' && value !== 0 && value !== undefined) {
      return false;
    }
  }
  return true;
}

function isNumberValue(val: CSSNumericValue): boolean {
  const type = val.type();
  for (const [key, value] of Object.entries(type)) {
    if (value !== 0 && value !== undefined) {
      return false;
    }
  }
  return true;
}

function isAngleValue(val: CSSNumericValue): boolean {
  const type = val.type();
  if (type.angle !== 1) return false;
  for (const [key, value] of Object.entries(type)) {
    if (key !== 'angle' && value !== 0 && value !== undefined) {
      return false;
    }
  }
  return true;
}

export function toPercentComponent(val: any, name: string): CSSNumericValue | CSSKeywordValue {
  if (val === undefined) {
    throw new DOMException(`${name} cannot be undefined`, 'SyntaxError');
  }
  if (typeof val === 'string') {
    try {
      const parsed = CSSNumericValue.parse(val);
      if (!isPercentValue(parsed)) {
        throw new DOMException(`${name} must be a percent`, 'SyntaxError');
      }
      return parsed;
    } catch (e) {
      if (val.toLowerCase() === 'none') {
        return new CSSKeywordValue('none');
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
    return new CSSUnitValue(val * 100, 'percent');
  }
  if (val instanceof CSSNumericValue) {
    if (!isPercentValue(val)) {
      throw new DOMException(`${name} must be a percent`, 'SyntaxError');
    }
    return val;
  }
  throw new DOMException(`Invalid value for ${name}`, 'SyntaxError');
}

export function toRGBComponent(val: any, name: string): CSSNumericValue | CSSKeywordValue {
  if (val === undefined) {
    throw new DOMException(`${name} cannot be undefined`, 'SyntaxError');
  }
  if (typeof val === 'string') {
    try {
      const parsed = CSSNumericValue.parse(val);
      if (!isPercentValue(parsed) && !isNumberValue(parsed)) {
        throw new DOMException(`${name} must be a number or percent`, 'SyntaxError');
      }
      return parsed;
    } catch (e) {
      if (val.toLowerCase() === 'none') {
        return new CSSKeywordValue('none');
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
    return new CSSUnitValue(val * 100, 'percent');
  }
  if (val instanceof CSSNumericValue) {
    if (!isPercentValue(val) && !isNumberValue(val)) {
      throw new DOMException(`${name} must be a number or percent`, 'SyntaxError');
    }
    return val;
  }
  throw new DOMException(`Invalid value for ${name}`, 'SyntaxError');
}

export function toHSLHueComponent(val: any): CSSNumericValue | CSSKeywordValue {
  if (val === undefined) {
    return new CSSKeywordValue('undefined');
  }
  if (typeof val === 'string') {
    try {
      const parsed = CSSNumericValue.parse(val);
      if (!isAngleValue(parsed) && !isNumberValue(parsed)) {
        throw new DOMException('CSSHSL.h must be an angle or a number', 'SyntaxError');
      }
      return parsed;
    } catch (e) {
      if (val.toLowerCase() === 'none') {
        return new CSSKeywordValue('none');
      }
      if (val.toLowerCase() === 'undefined') {
        return new CSSKeywordValue('undefined');
      }
      if (e instanceof DOMException && e.name === 'SyntaxError') {
        throw e;
      }
      throw new DOMException(`Invalid string for CSSHSL.h: ${val}`, 'SyntaxError');
    }
  }
  if (val instanceof CSSKeywordValue) {
    return val;
  }
  if (typeof val === 'number') {
    return new CSSUnitValue(val, 'deg');
  }
  if (val instanceof CSSNumericValue) {
    if (!isAngleValue(val) && !isNumberValue(val)) {
      throw new DOMException('CSSHSL.h must be an angle or a number', 'SyntaxError');
    }
    return val;
  }
  throw new DOMException('Invalid value for CSSHSL.h', 'SyntaxError');
}

export function toHWBHueComponent(val: any): CSSNumericValue {
  if (val === undefined || typeof val === 'number' || typeof val === 'string' || val instanceof CSSKeywordValue) {
    throw new TypeError('CSSHWB.h must be a CSSNumericValue');
  }
  if (!(val instanceof CSSNumericValue)) {
    throw new TypeError('CSSHWB.h must be a CSSNumericValue');
  }
  if (!isAngleValue(val)) {
    throw new DOMException('CSSHWB.h must be an angle', 'SyntaxError');
  }
  return val;
}

export function toLabColorComponent(val: any, name: string): CSSNumericValue | CSSKeywordValue {
  if (val === undefined) {
    throw new DOMException(`${name} cannot be undefined`, 'SyntaxError');
  }
  if (typeof val === 'string') {
    try {
      const parsed = CSSNumericValue.parse(val);
      if (!isPercentValue(parsed) && !isNumberValue(parsed)) {
        throw new DOMException(`${name} must be a number or percent`, 'SyntaxError');
      }
      return parsed;
    } catch (e) {
      if (val.toLowerCase() === 'none') {
        return new CSSKeywordValue('none');
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
    return new CSSUnitValue(val, 'number');
  }
  if (val instanceof CSSNumericValue) {
    if (!isPercentValue(val) && !isNumberValue(val)) {
      throw new DOMException(`${name} must be a number or percent`, 'SyntaxError');
    }
    return val;
  }
  throw new DOMException(`Invalid value for ${name}`, 'SyntaxError');
}

export function toLCHHueComponent(val: any): CSSNumericValue | CSSKeywordValue {
  if (val === undefined) {
    throw new DOMException('CSSLCH.h cannot be undefined', 'SyntaxError');
  }
  if (typeof val === 'string') {
    try {
      const parsed = CSSNumericValue.parse(val);
      if (!isAngleValue(parsed)) {
        throw new DOMException('CSSLCH.h must be an angle', 'SyntaxError');
      }
      return parsed;
    } catch (e) {
      if (val.toLowerCase() === 'none') {
        return new CSSKeywordValue('none');
      }
      if (e instanceof DOMException && e.name === 'SyntaxError') {
        throw e;
      }
      throw new DOMException(`Invalid string for CSSLCH.h: ${val}`, 'SyntaxError');
    }
  }
  if (val instanceof CSSKeywordValue) {
    return val;
  }
  if (typeof val === 'number') {
    return new CSSUnitValue(val, 'deg');
  }
  if (val instanceof CSSNumericValue) {
    if (!isAngleValue(val)) {
      throw new DOMException('CSSLCH.h must be an angle', 'SyntaxError');
    }
    return val;
  }
  throw new DOMException('Invalid value for CSSLCH.h', 'SyntaxError');
}
