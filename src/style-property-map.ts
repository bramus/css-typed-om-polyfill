import { CSSStyleValue, CSSUnparsedValue, CSSKeywordValue } from './css-style-value';
import { CSSUnitValue, CSSMathValue } from './css-numeric-value';
import { simplifyCalculation } from './parser/simplify-calculation';
import { getDummyStyle, isSupportedProperty, isShorthandProperty, serializeComputedBackground, splitCommated, listValuedProperties } from './utils';



function shouldWrapInCalc(property: string, val: CSSUnitValue): boolean {
  const propLower = property.toLowerCase();
  if (propLower.startsWith('--')) return false;

  const temp = getDummyStyle();

  // Test raw
  temp.cssText = '';
  try {
    temp.setProperty(property, val.toString());
    if (temp.getPropertyValue(property) !== '') {
      return false;
    }
  } catch (e) {}

  // Test calc
  temp.cssText = '';
  try {
    temp.setProperty(property, `calc(${val.toString()})`);
    return temp.getPropertyValue(property) !== '';
  } catch (e) {}

  return false;
}

const LENGTH_UNITS = new Set(['cap', 'ch', 'em', 'ex', 'ic', 'lh', 'rcap', 'rch', 'rem', 'rex', 'ric', 'rlh', 'vh', 'vmax', 'vmin', 'vw', 'cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax', 'px', 'cm', 'mm', 'in', 'pt', 'pc', 'Q']);
const ANGLE_UNITS = new Set(['deg', 'grad', 'rad', 'turn']);
const TIME_UNITS = new Set(['s', 'ms']);
const FREQUENCY_UNITS = new Set(['Hz', 'kHz']);
const RESOLUTION_UNITS = new Set(['dpi', 'dpcm', 'dppx']);

function validateValuesForProperty(property: string, values: (CSSStyleValue | string)[]): string {
  const propLower = property.toLowerCase();
  const isList = listValuedProperties.has(propLower);

  if (!isList && values.length > 1) {
    throw new TypeError(`Property ${property} is not list-valued and cannot accept multiple values`);
  }

  if (values.length > 1) {
    for (const val of values) {
      if (val instanceof CSSUnparsedValue) {
        throw new TypeError('Cannot mix CSSUnparsedValue with other values');
      }
      if (typeof val === 'string' && val.toLowerCase().includes('var(')) {
        throw new TypeError('Cannot mix variable references with other values');
      }
    }
  }

  function getRepresentative(val: CSSUnitValue): CSSUnitValue {
    const unit = val.unit;
    if (unit === 'number') return new CSSUnitValue(1, 'number');
    if (unit === 'percent') return new CSSUnitValue(1, 'percent');

    if (LENGTH_UNITS.has(unit)) return new CSSUnitValue(1, 'px');
    if (ANGLE_UNITS.has(unit)) return new CSSUnitValue(1, 'deg');
    if (TIME_UNITS.has(unit)) return new CSSUnitValue(1, 's');
    if (FREQUENCY_UNITS.has(unit)) return new CSSUnitValue(1, 'Hz');
    if (RESOLUTION_UNITS.has(unit)) return new CSSUnitValue(1, 'dpi');

    if (unit === 'fr') return new CSSUnitValue(1, 'fr');

    return val;
  }

  const valStrings: string[] = [];
  const validationStrings: string[] = [];
  for (const val of values) {
    if (typeof val === 'string') {
      valStrings.push(val);
      validationStrings.push(val);
    } else {
      if ((val as any)._associatedProperty && (val as any)._associatedProperty !== propLower) {
        throw new TypeError(`CSSStyleValue is associated with ${(val as any)._associatedProperty}, not ${property}`);
      }
      if (val instanceof CSSUnitValue) {
        if (shouldWrapInCalc(property, val)) {
          valStrings.push(`calc(${val.toString()})`);
        } else {
          valStrings.push(val.toString());
        }
        validationStrings.push(getRepresentative(val).toString());
      } else {
        valStrings.push(val.toString());
        validationStrings.push(val.toString());
      }
    }
  }

  const finalString = valStrings.join(', ');
  const validationString = validationStrings.join(', ');

  if (!propLower.startsWith('--')) {
    const dummy = getDummyStyle();
    dummy.cssText = '';
    dummy.setProperty(property, validationString);
    if (dummy.getPropertyValue(property) === '') {
      throw new TypeError(`Invalid value for property ${property}: ${finalString}`);
    }
  }

  return finalString;
}

const longhandToShorthands: Record<string, string[]> = {
  'transition-property': ['transition'],
  'transition-duration': ['transition'],
  'transition-timing-function': ['transition'],
  'transition-delay': ['transition'],
  'animation-name': ['animation'],
  'animation-duration': ['animation'],
  'animation-timing-function': ['animation'],
  'animation-delay': ['animation'],
  'animation-iteration-count': ['animation'],
  'animation-direction': ['animation'],
  'animation-fill-mode': ['animation'],
  'animation-play-state': ['animation'],
  'margin-top': ['margin'],
  'margin-right': ['margin'],
  'margin-bottom': ['margin'],
  'margin-left': ['margin'],
  'padding-top': ['padding'],
  'padding-right': ['padding'],
  'padding-bottom': ['padding'],
  'padding-left': ['padding'],
};

function isPendingSubstitution(style: CSSStyleDeclaration, property: string): boolean {
  const value = style.getPropertyValue(property);
  if (value.toLowerCase().includes('var(')) {
    return true;
  }
  const shorthands = longhandToShorthands[property.toLowerCase()];
  if (shorthands) {
    for (const shorthand of shorthands) {
      const shortVal = style.getPropertyValue(shorthand);
      if (shortVal.toLowerCase().includes('var(')) {
        return true;
      }
    }
  }
  return false;
}

function hasExplicitMinSize(element: Element, property: string): boolean {
  const hasValue = (style: CSSStyleDeclaration) => {
    const val = style.getPropertyValue(property);
    return val !== '' && val !== 'auto';
  };
  if (element instanceof HTMLElement) {
    if (hasValue(element.style)) return true;
  }
  const doc = element.ownerDocument;
  if (!doc) return false;
  const sheets = doc.styleSheets;
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i]!;
    try {
      const rules = sheet.cssRules;
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j]!;
        if (rule instanceof CSSStyleRule) {
          if (element.matches(rule.selectorText)) {
            if (hasValue(rule.style)) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  return false;
}

const opacityProperties = new Set([
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'flood-opacity',
  'stop-opacity'
]);

const borderWidthProperties = new Set([
  'border-top-width',
  'border-left-width',
  'border-right-width',
  'border-bottom-width'
]);

const cornerRadiusProperties = new Set([
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius'
]);

const alwaysResolveProperties = new Set([
  'font-size',
  'word-spacing',
  'line-height',
  'vertical-align'
]);



const unsupportedComputedProperties = new Set([
  'border-image-slice',
  'border-image-width',
  'border-image-outset',
  'border-image-repeat',
  'border-image-source',
  'column-rule-width',
  'column-rule-style',
  'clip-path',
  'clip'
]);

const cssWideKeywords = new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer']);

function shouldFallbackToCSSStyleValue(property: string, value: string, isComputed: boolean): boolean {
  const valueLower = value.toLowerCase().trim();
  if (cssWideKeywords.has(valueLower)) return false;
  if (valueLower.includes('var(')) return false;

  const propLower = property.toLowerCase();
  if (propLower === 'filter' || propLower === 'backdrop-filter') {
    return valueLower !== 'none';
  }
  if (propLower === 'cursor') {
    return valueLower.includes('url(');
  }
  if (propLower === 'will-change') {
    return valueLower !== 'auto';
  }
  if (isComputed && cornerRadiusProperties.has(propLower)) {
    return true;
  }
  return unsupportedComputedProperties.has(propLower);
}

function getComputedBorderWidth(element: Element, property: string, style: CSSStyleDeclaration): string {
  if (!(element instanceof HTMLElement)) {
    return style.getPropertyValue(property);
  }
  const suffix = property.split('-')[1]; // top, left, right, bottom
  const styleProp = `border-${suffix}-style`;
  const currentStyle = window.getComputedStyle(element).getPropertyValue(styleProp);
  if (currentStyle === 'none' || currentStyle === 'hidden') {
    const inlineStyle = element.style.getPropertyValue(styleProp);
    const inlinePriority = element.style.getPropertyPriority(styleProp);
    element.style.setProperty(styleProp, 'solid', 'important');
    const resolved = window.getComputedStyle(element).getPropertyValue(property);
    if (inlineStyle) {
      element.style.setProperty(styleProp, inlineStyle, inlinePriority);
    } else {
      element.style.removeProperty(styleProp);
    }
    return resolved;
  }
  return style.getPropertyValue(property);
}

const privateToken = Symbol.for('css-typed-om-polyfill-private-token');

// Concrete implementation backing Element.computedStyleMap()
export class StylePropertyMapReadOnly {
  constructor(protected element: Element | null, protected style: CSSStyleDeclaration, token?: any) {
    if (token !== privateToken) {
      throw new TypeError('Illegal constructor');
    }
  }

  get(property: string): CSSStyleValue | undefined {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    if (this.element && this.element instanceof HTMLElement &&
        !cornerRadiusProperties.has(propLower) &&
        !unsupportedComputedProperties.has(propLower) &&
        !alwaysResolveProperties.has(propLower)) {
      const inlineVal = (this.element.attributeStyleMap as any).get(property) as CSSStyleValue | undefined;
      if (inlineVal && !opacityProperties.has(propLower)) {
        if (inlineVal instanceof CSSUnitValue && inlineVal.unit === 'percent') {
          if (inlineVal.value < 0 && shouldWrapInCalc(property, inlineVal)) {
            return new CSSUnitValue(0, 'percent');
          }
          return inlineVal;
        }
        if (inlineVal instanceof CSSMathValue) {
          const type = inlineVal.type();
          if (type.percent || type.percentHint) {
            try {
              const simplified = simplifyCalculation(inlineVal);
              if (simplified instanceof CSSUnitValue && simplified.unit === 'percent') {
                if (simplified.value < 0 && shouldWrapInCalc(property, simplified)) {
                  return new CSSUnitValue(0, 'percent');
                }
                return simplified;
              }
              return simplified;
            } catch (e) {
              // Ignore
            }
          }
        }
        if (inlineVal instanceof CSSKeywordValue) {
          const valLower = inlineVal.value.toLowerCase();
          if (valLower === 'currentcolor' || valLower === 'auto') {
            return inlineVal;
          }
        }
      }
    }
    let value = propLower === 'background' ? serializeComputedBackground(this.style) : this.style.getPropertyValue(property);
    if (propLower === 'background-size' && value) {
      const parts = splitCommated(value);
      const simplified = parts.map(p => {
        if (p.endsWith(' auto')) {
          return p.slice(0, -5);
        }
        return p;
      });
      value = simplified.join(', ');
    }

    if (this.element && borderWidthProperties.has(propLower)) {
      value = getComputedBorderWidth(this.element, property, this.style);
    }
    if (this.element && (propLower === 'min-width' || propLower === 'min-height') && value === '0px') {
      if (!hasExplicitMinSize(this.element, propLower)) {
        value = 'auto';
      }
    }
    if (!value) return undefined;
    if (shouldFallbackToCSSStyleValue(property, value, true)) {
      return new CSSStyleValue(value, privateToken);
    }
    if (isShorthandProperty(propLower)) {
      if (value.toLowerCase().includes('var(')) {
        try {
          const values = CSSStyleValue.parseAll(property, value);
          const val = values[0];
          if (val) {
            (val as any)._associatedProperty = propLower;
            return val;
          }
        } catch (e) {}
      }
      const val = new CSSStyleValue(value, privateToken);
      (val as any)._associatedProperty = propLower;
      return val;
    }
    try {
      const values = CSSStyleValue.parseAll(property, value);
      return values[0];
    } catch (e) {
      return undefined;
    }
  }

  getAll(property: string): CSSStyleValue[] {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    if (this.element && this.element instanceof HTMLElement) {
      const inlineVal = (this.element.attributeStyleMap as any).getAll(property) as CSSStyleValue[];
      if (inlineVal.length > 0 && !opacityProperties.has(propLower)) {
        const first = inlineVal[0];
        if (first instanceof CSSUnitValue && first.unit === 'percent') {
          if (first.value < 0 && shouldWrapInCalc(property, first)) {
            return [new CSSUnitValue(0, 'percent')];
          }
          return inlineVal;
        }
        if (first instanceof CSSMathValue) {
          const type = first.type();
          if (type.percent || type.percentHint) {
            try {
              return inlineVal.map(v => {
                if (v instanceof CSSMathValue) {
                  const simplified = simplifyCalculation(v);
                  if (simplified instanceof CSSUnitValue && simplified.unit === 'percent') {
                    if (simplified.value < 0 && shouldWrapInCalc(property, simplified)) {
                      return new CSSUnitValue(0, 'percent');
                    }
                    return simplified;
                  }
                  return simplified;
                }
                if (v instanceof CSSUnitValue && v.unit === 'percent') {
                  if (v.value < 0 && shouldWrapInCalc(property, v)) {
                    return new CSSUnitValue(0, 'percent');
                  }
                }
                return v;
              });
            } catch (e) {
              // Ignore
            }
          }
        }
        if (first instanceof CSSKeywordValue) {
          const valLower = first.value.toLowerCase();
          if (valLower === 'currentcolor' || valLower === 'auto') {
            return inlineVal;
          }
        }
      }
    }
    let value = this.style.getPropertyValue(property);
    if (this.element && borderWidthProperties.has(propLower)) {
      value = getComputedBorderWidth(this.element, property, this.style);
    }
    if (this.element && (propLower === 'min-width' || propLower === 'min-height') && value === '0px') {
      if (!hasExplicitMinSize(this.element, propLower)) {
        value = 'auto';
      }
    }
    if (!value) return [];
    if (isShorthandProperty(propLower)) {
      if (value.toLowerCase().includes('var(')) {
        try {
          const results = CSSStyleValue.parseAll(property, value);
          for (const val of results) {
            (val as any)._associatedProperty = propLower;
          }
          return results;
        } catch (e) {}
      }
      const val = new CSSStyleValue(value, privateToken);
      (val as any)._associatedProperty = propLower;
      return [val];
    }
    try {
      return CSSStyleValue.parseAll(property, value);
    } catch (e) {
      return [];
    }
  }

  has(property: string): boolean {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    return this.style.getPropertyValue(property) !== '';
  }

  get size(): number {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    return this.style.length;
  }

  *keys(): IterableIterator<string> {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    const standardProps: string[] = [];
    const customProps: string[] = [];
    for (let i = 0; i < this.style.length; i++) {
      const prop = this.style[i]!;
      if (prop.startsWith('--')) {
        customProps.push(prop);
      } else {
        standardProps.push(prop);
      }
    }

    // Sort standard properties: normal before prefixed, then alphabetical
    standardProps.sort((a, b) => {
      const aPref = a.startsWith('-');
      const bPref = b.startsWith('-');
      if (aPref === bPref) {
        return a < b ? -1 : 1;
      }
      return bPref ? -1 : 1; // non-prefixed first
    });

    // Sort custom properties by code-point (alphabetical)
    customProps.sort();

    for (const prop of standardProps) {
      yield prop;
    }
    for (const prop of customProps) {
      yield prop;
    }
  }

  *values(): IterableIterator<CSSStyleValue[]> {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    for (const key of this.keys()) {
      yield this.getAll(key);
    }
  }

  *entries(): IterableIterator<[string, CSSStyleValue[]]> {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    for (const key of this.keys()) {
      yield [key, this.getAll(key)];
    }
  }

  forEach(
    callback: (value: CSSStyleValue[], key: string, map: StylePropertyMapReadOnly) => void
  ): void {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    const thisArg = arguments[1];
    for (const [key, val] of this.entries()) {
      callback.call(thisArg, val, key, this);
    }
  }

  [Symbol.iterator](): IterableIterator<[string, CSSStyleValue[]]> {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    return this.entries();
  }
}

interface CacheEntry {
  values: CSSStyleValue[];
  serialized: string;
}

// Concrete implementation backing Element.attributeStyleMap and CSSStyleRule.styleMap
export class StylePropertyMap extends StylePropertyMapReadOnly {
  private _cache = new Map<string, CacheEntry>();

  constructor(style: CSSStyleDeclaration, token?: any) {
    super(null, style, token);
    if (token !== privateToken) {
      throw new TypeError('Illegal constructor');
    }
  }

  get(property: string): CSSStyleValue | undefined {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    const currentValue = this.style.getPropertyValue(property);
    
    // Check cache
    const cached = this._cache.get(propLower);
    if (cached && cached.serialized === currentValue) {
      return cached.values[0];
    }
    if (cached) {
      this._cache.delete(propLower);
    }

    if (!currentValue) return undefined;
    if (cssWideKeywords.has(currentValue.toLowerCase().trim())) {
      return new CSSKeywordValue(currentValue.trim());
    }
    if (shouldFallbackToCSSStyleValue(property, currentValue, false)) {
      return new CSSStyleValue(currentValue, privateToken);
    }
    if (isShorthandProperty(propLower)) {
      if (currentValue.toLowerCase().includes('var(')) {
        try {
          const values = CSSStyleValue.parseAll(property, currentValue);
          const val = values[0];
          if (val) {
            (val as any)._associatedProperty = propLower;
            return val;
          }
        } catch (e) {}
      }
      const val = new CSSStyleValue(currentValue, privateToken);
      (val as any)._associatedProperty = propLower;
      return val;
    }
    try {
      const values = CSSStyleValue.parseAll(property, currentValue);
      return values[0];
    } catch (e) {
      return undefined;
    }
  }

  getAll(property: string): CSSStyleValue[] {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    const currentValue = this.style.getPropertyValue(property);

    // Check cache
    const cached = this._cache.get(propLower);
    if (cached && cached.serialized === currentValue) {
      return cached.values;
    }
    if (cached) {
      this._cache.delete(propLower);
    }

    if (!currentValue) return [];
    if (isShorthandProperty(propLower)) {
      if (currentValue.toLowerCase().includes('var(')) {
        try {
          const results = CSSStyleValue.parseAll(property, currentValue);
          for (const val of results) {
            (val as any)._associatedProperty = propLower;
          }
          return results;
        } catch (e) {}
      }
      const val = new CSSStyleValue(currentValue, privateToken);
      (val as any)._associatedProperty = propLower;
      return [val];
    }
    try {
      return CSSStyleValue.parseAll(property, currentValue);
    } catch (e) {
      return [];
    }
  }

  has(property: string): boolean {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    return this.style.getPropertyValue(property) !== '';
  }

  get size(): number {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    return this.style.length;
  }

  *keys(): IterableIterator<string> {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    for (let i = 0; i < this.style.length; i++) {
      yield this.style[i]!;
    }
  }

  *values(): IterableIterator<CSSStyleValue[]> {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    for (const key of this.keys()) {
      yield this.getAll(key);
    }
  }

  *entries(): IterableIterator<[string, CSSStyleValue[]]> {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    for (const key of this.keys()) {
      yield [key, this.getAll(key)];
    }
  }

  forEach(
    callback: (value: CSSStyleValue[], key: string, map: StylePropertyMapReadOnly) => void
  ): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    const thisArg = arguments[1];
    for (const [key, val] of this.entries()) {
      callback.call(thisArg, val, key, this);
    }
  }

  set(property: string, ...values: (CSSStyleValue | string)[]): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    if (isShorthandProperty(propLower)) {
      for (const val of values) {
        if (typeof val !== 'string' && 
            val.constructor !== CSSStyleValue && 
            val.constructor !== CSSKeywordValue && 
            val.constructor !== CSSUnparsedValue) {
          throw new TypeError(`Cannot set shorthand property ${property} with ${val.constructor.name}`);
        }
      }
    }

    if (values.length === 0) {
      this.delete(property);
      return;
    }

    const finalString = validateValuesForProperty(property, values);
    this.style.setProperty(property, finalString);

    // Update cache
    try {
      let parsedValues: CSSStyleValue[];
      const isShorthand = isShorthandProperty(propLower);
      if (shouldFallbackToCSSStyleValue(property, finalString, false)) {
        const val = new CSSStyleValue(finalString, privateToken);
        if (isShorthand) {
          (val as any)._associatedProperty = propLower;
        }
        parsedValues = [val];
      } else {
        try {
          parsedValues = CSSStyleValue.parseAll(property, finalString);
          if (isShorthand) {
            parsedValues = parsedValues.map(val => {
              if (val instanceof CSSKeywordValue || val instanceof CSSUnparsedValue) {
                return val;
              }
              const fallback = new CSSStyleValue(finalString, privateToken);
              (fallback as any)._associatedProperty = propLower;
              return fallback;
            });
          }
        } catch (e) {
          if (isShorthand) {
            const val = new CSSStyleValue(finalString, privateToken);
            (val as any)._associatedProperty = propLower;
            parsedValues = [val];
          } else {
            throw e;
          }
        }
      }
      this._cache.set(propLower, {
        values: parsedValues,
        serialized: this.style.getPropertyValue(property)
      });
    } catch (e) {
      this._cache.delete(propLower);
    }
  }

  append(property: string, ...values: (CSSStyleValue | string)[]): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    if (isShorthandProperty(propLower)) {
      throw new TypeError(`Cannot append to shorthand property: ${property}`);
    }
    if (!listValuedProperties.has(propLower)) {
      throw new TypeError(`Property is not list-valued: ${property}`);
    }

    if (values.length === 0) return;

    for (const val of values) {
      if (val instanceof CSSUnparsedValue) {
        throw new TypeError('Cannot append CSSUnparsedValue');
      }
      if (typeof val === 'string' && val.toLowerCase().includes('var(')) {
        throw new TypeError('Cannot append variable reference');
      }
    }

    if (isPendingSubstitution(this.style, property)) {
      throw new TypeError('Cannot append to a value containing variable references');
    }

    const currentValue = this.style.getPropertyValue(property);
    const cached = this._cache.get(propLower);
    
    let existingValues: (CSSStyleValue | string)[] = [];
    if (cached && cached.serialized === currentValue) {
      existingValues = cached.values;
    } else {
      if (currentValue) {
        if (shouldFallbackToCSSStyleValue(property, currentValue, false)) {
          existingValues = [new CSSStyleValue(currentValue, privateToken)];
        } else {
          try {
            existingValues = CSSStyleValue.parseAll(property, currentValue);
          } catch (e) {
            existingValues = [currentValue];
          }
        }
      }
    }

    const allValues = [...existingValues, ...values];
    const finalString = validateValuesForProperty(property, allValues);
    this.style.setProperty(property, finalString);

    // Update cache
    try {
      let parsedValues: CSSStyleValue[];
      if (shouldFallbackToCSSStyleValue(property, finalString, false)) {
        parsedValues = [new CSSStyleValue(finalString, privateToken)];
      } else {
        parsedValues = CSSStyleValue.parseAll(property, finalString);
      }
      this._cache.set(propLower, {
        values: parsedValues,
        serialized: this.style.getPropertyValue(property)
      });
    } catch (e) {
      this._cache.delete(propLower);
    }
  }

  delete(property: string): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }

    this.style.removeProperty(property);
    this._cache.delete(propLower);
  }

  clear(): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    this.style.cssText = '';
    this._cache.clear();
  }
}

StylePropertyMapReadOnly.prototype[Symbol.iterator] = StylePropertyMapReadOnly.prototype.entries;
StylePropertyMap.prototype[Symbol.iterator] = StylePropertyMap.prototype.entries;
