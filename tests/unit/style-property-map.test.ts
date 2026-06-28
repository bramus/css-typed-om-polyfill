// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '../../src/index'; // Register polyfill and patch prototypes
import { CSSUnitValue } from '../../src/css-numeric-value';
import { CSSKeywordValue } from '../../src/css-style-value';

describe('StylePropertyMap and DOM Integration', () => {
  it('should get and set inline styles via attributeStyleMap', () => {
    const div = document.createElement('div');
    expect(div.attributeStyleMap).toBeDefined();

    // Set a value
    div.attributeStyleMap.set('width', '100px');
    expect(div.style.width).toBe('100px');

    // Get the value
    const width = div.attributeStyleMap.get('width');
    expect(width).toBeInstanceOf(CSSUnitValue);
    expect((width as CSSUnitValue).value).toBe(100);
    expect((width as CSSUnitValue).unit).toBe('px');

    // Delete the value
    div.attributeStyleMap.delete('width');
    expect(div.style.width).toBe('');
    expect(div.attributeStyleMap.get('width')).toBeUndefined();
  });

  it('should read computed styles via computedStyleMap()', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.style.height = '200px';

    const computed = div.computedStyleMap();
    expect(computed).toBeDefined();

    const height = computed.get('height');
    expect(height).toBeInstanceOf(CSSUnitValue);
    expect((height as CSSUnitValue).value).toBe(200);
    expect((height as CSSUnitValue).unit).toBe('px');

    document.body.removeChild(div);
  });

  it('should handle keywords and multiple values', () => {
    const div = document.createElement('div');
    div.attributeStyleMap.set('display', 'flex');
    expect(div.style.display).toBe('flex');

    const display = div.attributeStyleMap.get('display');
    expect(display).toBeInstanceOf(CSSKeywordValue);
    expect((display as CSSKeywordValue).value).toBe('flex');
  });
});
