import { CSSStyleValue, CSSUnparsedValue, CSSKeywordValue } from './css-style-value';
import { CSSUnitValue, CSSMathValue } from './css-numeric-value';
import { simplifyCalculation } from './parser/simplify-calculation';
import { getDummyStyle, isSupportedProperty, isShorthandProperty, listValuedProperties } from './utils';
import { LENGTH_UNITS, ANGLE_UNITS, TIME_UNITS, FREQUENCY_UNITS, RESOLUTION_UNITS } from './units';
import propertiesData from './data/Properties.json';



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

const shorthandToLonghands: Record<string, string[]> = {};
for (const [prop, details] of Object.entries(propertiesData as Record<string, { longhands?: string[] }>)) {
  if (details.longhands && details.longhands.length > 0) {
    shorthandToLonghands[prop] = details.longhands;
  }
}

const longhandToShorthands: Record<string, string[]> = {};

function expandShorthandRecursive(shorthand: string): string[] {
  if (!shorthandToLonghands[shorthand]) {
    return [shorthand];
  }
  let result: string[] = [];
  for (const child of shorthandToLonghands[shorthand]!) {
    result = result.concat(expandShorthandRecursive(child));
  }
  return result;
}

for (const shorthand of Object.keys(shorthandToLonghands)) {
  const longhands = expandShorthandRecursive(shorthand);
  for (const longhand of longhands) {
    if (longhand === shorthand) continue;
    if (!longhandToShorthands[longhand]) {
      longhandToShorthands[longhand] = [];
    }
    if (!longhandToShorthands[longhand].includes(shorthand)) {
      longhandToShorthands[longhand].push(shorthand);
    }
  }
}

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

const cornerRadiusProperties = new Set([
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius'
]);



const unsupportedComputedProperties = new Set([
  'border-image-slice',
  'border-image-width',
  'border-image-outset',
  'border-image-repeat',
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
  return isComputed && unsupportedComputedProperties.has(propLower);
}



const privateToken = Symbol.for('css-typed-om-polyfill-private-token');

// Concrete implementation backing Element.computedStyleMap()
export class StylePropertyMapReadOnly {
  constructor(protected element: Element | null, protected style: CSSStyleDeclaration, token?: any) {
    if (token !== privateToken) {
      throw new TypeError('Illegal constructor');
    }
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymapreadonly-get
  get(property: string): CSSStyleValue | undefined {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. Let val be the result of running "get the CSSStyleValue" for property on this.
    let value = this.style.getPropertyValue(property);
    if (!value) {
      if (this.element && isShorthandProperty(propLower)) {
        const val = new CSSStyleValue('', privateToken);
        (val as any)._associatedProperty = propLower;
        return val;
      }
      return undefined;
    }
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymapreadonly-getall
  getAll(property: string): CSSStyleValue[] {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. Let val be the result of running "get the list of CSSStyleValues" for property on this.
    let value = this.style.getPropertyValue(property);
    if (!value) {
      if (this.element && isShorthandProperty(propLower)) {
        const val = new CSSStyleValue('', privateToken);
        (val as any)._associatedProperty = propLower;
        return [val];
      }
      return [];
    }
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymapreadonly-has
  has(property: string): boolean {
    if (!(this instanceof StylePropertyMapReadOnly)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMapReadOnly");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. If the result of running "get the CSSStyleValue" for property on this is null, return false. Otherwise, return true.
    // @NOTE: We check if the property value is not empty string.
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymapreadonly-get
  get(property: string): CSSStyleValue | undefined {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. Let val be the result of running "get the CSSStyleValue" for property on this.
    // @NOTE: Checking cache first.
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymapreadonly-getall
  getAll(property: string): CSSStyleValue[] {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. Let val be the result of running "get the list of CSSStyleValues" for property on this.
    // @NOTE: Checking cache first.
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymapreadonly-has
  has(property: string): boolean {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. If the result of running "get the CSSStyleValue" for property on this is null, return false. Otherwise, return true.
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymap-set
  set(property: string, ...values: (CSSStyleValue | string)[]): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. If property is a shorthand property, throw a TypeError.
    // @NOTE: Deviating from spec to allow setting shorthand properties under certain conditions
    // (only with string, CSSStyleValue, CSSKeywordValue, or CSSUnparsedValue) instead of throwing TypeError immediately.
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

    // @NOTE: If values is empty, we delete the property.
    if (values.length === 0) {
      this.delete(property);
      return;
    }

    // 3. Let rectified be the result of running "rectify a list of CSSStyleValues" with values.
    // 4. Run "set the CSSStyleValue" for property on this with rectified.
    // @NOTE: validateValuesForProperty performs validation and returns the serialized string.
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymap-append
  append(property: string, ...values: (CSSStyleValue | string)[]): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }
    // 2. If property is a shorthand property, throw a TypeError.
    if (isShorthandProperty(propLower)) {
      throw new TypeError(`Cannot append to shorthand property: ${property}`);
    }
    // 3. If property does not support list values, throw a TypeError.
    if (!listValuedProperties.has(propLower)) {
      throw new TypeError(`Property is not list-valued: ${property}`);
    }

    if (values.length === 0) return;

    // 4. Let rectified be the result of running "rectify a list of CSSStyleValues" with values.
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

    // 5. Run "append to the CSSStyleValue" ...
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

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymap-delete
  delete(property: string): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    // 1. If property is not a valid CSS property, throw a TypeError.
    if (!property) {
      throw new TypeError('Property name cannot be null or empty');
    }
    const propLower = property.toLowerCase();
    if (!isSupportedProperty(propLower)) {
      throw new TypeError(`Unsupported property: ${property}`);
    }

    // 2. Run "delete the CSSStyleValue" ...
    this.style.removeProperty(property);
    this._cache.delete(propLower);
  }

  // https://drafts.css-houdini.org/css-typed-om-1/#dom-stylepropertymap-clear
  clear(): void {
    if (!(this instanceof StylePropertyMap)) {
      throw new TypeError("Value of 'this' is not a StylePropertyMap");
    }
    // 1. Clear all properties.
    this.style.cssText = '';
    this._cache.clear();
  }
}

StylePropertyMapReadOnly.prototype[Symbol.iterator] = StylePropertyMapReadOnly.prototype.entries;
StylePropertyMap.prototype[Symbol.iterator] = StylePropertyMap.prototype.entries;
