import { CSSStyleValue } from './css-style-value';

export abstract class StylePropertyMapReadOnly {
  abstract get(property: string): CSSStyleValue | undefined;
  abstract getAll(property: string): CSSStyleValue[];
  abstract has(property: string): boolean;
  abstract get size(): number;

  abstract keys(): IterableIterator<string>;
  abstract values(): IterableIterator<CSSStyleValue[]>;
  abstract entries(): IterableIterator<[string, CSSStyleValue[]]>;
  abstract forEach(
    callback: (value: CSSStyleValue[], key: string, map: StylePropertyMapReadOnly) => void,
    thisArg?: any
  ): void;

  [Symbol.iterator](): IterableIterator<[string, CSSStyleValue[]]> {
    return this.entries();
  }
}

export abstract class StylePropertyMap extends StylePropertyMapReadOnly {
  abstract set(property: string, ...values: (CSSStyleValue | string)[]): void;
  abstract append(property: string, ...values: (CSSStyleValue | string)[]): void;
  abstract delete(property: string): void;
  abstract clear(): void;
}

// Concrete implementation backing Element.computedStyleMap()
export class CSSComputedStylePropertyMap extends StylePropertyMapReadOnly {
  constructor(private style: CSSStyleDeclaration) {
    super();
  }

  get(property: string): CSSStyleValue | undefined {
    const value = this.style.getPropertyValue(property);
    if (!value) return undefined;
    try {
      return CSSStyleValue.parse(property, value);
    } catch (e) {
      return undefined;
    }
  }

  getAll(property: string): CSSStyleValue[] {
    const value = this.style.getPropertyValue(property);
    if (!value) return [];
    try {
      return CSSStyleValue.parseAll(property, value);
    } catch (e) {
      return [];
    }
  }

  has(property: string): boolean {
    return this.style.getPropertyValue(property) !== '';
  }

  get size(): number {
    return this.style.length;
  }

  *keys(): IterableIterator<string> {
    for (let i = 0; i < this.style.length; i++) {
      yield this.style[i]!;
    }
  }

  *values(): IterableIterator<CSSStyleValue[]> {
    for (const key of this.keys()) {
      yield this.getAll(key);
    }
  }

  *entries(): IterableIterator<[string, CSSStyleValue[]]> {
    for (const key of this.keys()) {
      yield [key, this.getAll(key)];
    }
  }

  forEach(
    callback: (value: CSSStyleValue[], key: string, map: StylePropertyMapReadOnly) => void,
    thisArg?: any
  ): void {
    for (const [key, val] of this.entries()) {
      callback.call(thisArg, val, key, this);
    }
  }
}

// Concrete implementation backing Element.attributeStyleMap and CSSStyleRule.styleMap
export class CSSInlineStylePropertyMap extends StylePropertyMap {
  constructor(private style: CSSStyleDeclaration) {
    super();
  }

  get(property: string): CSSStyleValue | undefined {
    const value = this.style.getPropertyValue(property);
    if (!value) return undefined;
    try {
      return CSSStyleValue.parse(property, value);
    } catch (e) {
      return undefined;
    }
  }

  getAll(property: string): CSSStyleValue[] {
    const value = this.style.getPropertyValue(property);
    if (!value) return [];
    try {
      return CSSStyleValue.parseAll(property, value);
    } catch (e) {
      return [];
    }
  }

  has(property: string): boolean {
    return this.style.getPropertyValue(property) !== '';
  }

  get size(): number {
    return this.style.length;
  }

  *keys(): IterableIterator<string> {
    for (let i = 0; i < this.style.length; i++) {
      yield this.style[i]!;
    }
  }

  *values(): IterableIterator<CSSStyleValue[]> {
    for (const key of this.keys()) {
      yield this.getAll(key);
    }
  }

  *entries(): IterableIterator<[string, CSSStyleValue[]]> {
    for (const key of this.keys()) {
      yield [key, this.getAll(key)];
    }
  }

  forEach(
    callback: (value: CSSStyleValue[], key: string, map: StylePropertyMapReadOnly) => void,
    thisArg?: any
  ): void {
    for (const [key, val] of this.entries()) {
      callback.call(thisArg, val, key, this);
    }
  }

  set(property: string, ...values: (CSSStyleValue | string)[]): void {
    if (values.length === 0) {
      this.delete(property);
      return;
    }
    const valString = values.map(val => val.toString()).join(', ');
    this.style.setProperty(property, valString);
  }

  append(property: string, ...values: (CSSStyleValue | string)[]): void {
    if (values.length === 0) return;
    const existing = this.style.getPropertyValue(property);
    const newValString = values.map(val => val.toString()).join(', ');
    const finalString = existing ? `${existing}, ${newValString}` : newValString;
    this.style.setProperty(property, finalString);
  }

  delete(property: string): void {
    this.style.removeProperty(property);
  }

  clear(): void {
    const props = Array.from(this.keys());
    for (const prop of props) {
      this.delete(prop);
    }
  }
}
