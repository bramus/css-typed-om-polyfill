// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '../src/index';
import { CSSColorValue, CSSRGB, CSSHSL, CSSColor } from '../src/css-color-value';
import { CSSUnitValue } from '../src/css-numeric-value';
import { CSSKeywordValue } from '../src/css-style-value';

describe('CSSColorValue and Subclasses', () => {
  it('should construct and stringify CSSRGB', () => {
    const color = new CSSRGB(255, 0, 0, 0.5);
    expect(color.r.toString()).toBe('255');
    expect(color.g.toString()).toBe('0');
    expect(color.b.toString()).toBe('0');
    expect(color.alpha.toString()).toBe('0.5');
    expect(color.toString()).toBe('color(srgb 255 0 0 / 0.5)');
  });

  it('should construct and stringify CSSHSL', () => {
    const color = new CSSHSL(new CSSUnitValue(120, 'deg'), '100%', '50%', 1);
    expect(color.toString()).toBe('hsl(120deg 100% 50% / 1)');
  });

  it('should construct and stringify CSSColor (color() function)', () => {
    const color = new CSSColor('display-p3', [1, 0, 0], 1);
    expect(color.toString()).toBe('color(display-p3 1 0 0 / 1)');
  });

  it('should parse colors using CSSColorValue.parse()', () => {
    const parsedHex = CSSColorValue.parse('#00ff00');
    expect(parsedHex).toBeInstanceOf(CSSRGB);
    expect(parsedHex.toString()).toBe('color(srgb 0 255 0 / 1)');

    const parsedHsl = CSSColorValue.parse('hsl(240deg 100% 50%)');
    expect(parsedHsl).toBeInstanceOf(CSSHSL);
    expect(parsedHsl.toString()).toBe('hsl(240deg 100% 50% / 1)');
  });
});
