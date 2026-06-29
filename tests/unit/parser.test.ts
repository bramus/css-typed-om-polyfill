import { describe, it, expect } from 'vitest';
import { tokenizeString } from '../../src/parser/tokenizer';
import { parseCSSValue, parseAllCSSValues } from '../../src/parser/css-value-parser';
import { CSSKeywordValue, CSSUnparsedValue, CSSVariableReferenceValue, CSSImageValue } from '../../src/css-style-value';
import { CSSUnitValue, CSSMathSum, CSSMathProduct } from '../../src/css-numeric-value';
import { CSSTransformValue, CSSTranslate, CSSRotate } from '../../src/css-transform-value';
import { CSSRGB, CSSHSL } from '../../src/css-color-value';

describe('CSS Tokenizer', () => {
  it('should tokenize simple values', () => {
    const tokens = tokenizeString('10px 20% auto');
    expect(tokens.length).toBe(5); // 10px, space, 20%, space, auto
    expect((tokens[0] as any).value).toBe(10);
    expect((tokens[0] as any).unit).toBe('px');
    expect((tokens[2] as any).value).toBe(20);
    expect((tokens[4] as any).value).toBe('auto');
  });
});

describe('CSS Value Parser', () => {
  it('should parse keywords', () => {
    const val = parseCSSValue('width', 'auto');
    expect(val).toBeInstanceOf(CSSKeywordValue);
    expect((val as CSSKeywordValue).value).toBe('auto');
  });

  it('should parse simple numeric values', () => {
    const val = parseCSSValue('width', '10px');
    expect(val).toBeInstanceOf(CSSUnitValue);
    expect((val as CSSUnitValue).value).toBe(10);
    expect((val as CSSUnitValue).unit).toBe('px');
  });

  it('should parse math expressions', () => {
    const val = parseCSSValue('width', 'calc(10px + 20px)');
    expect(val).toBeInstanceOf(CSSMathSum);
    expect(val.toString()).toBe('calc(30px)');
  });

  it('should parse variables and unparsed values', () => {
    const val = parseCSSValue('width', 'var(--my-width,100px)');
    expect(val).toBeInstanceOf(CSSUnparsedValue);
    const unparsed = val as CSSUnparsedValue;
    expect(unparsed.length).toBe(1);
    expect(unparsed[0]).toBeInstanceOf(CSSVariableReferenceValue);
    const varRef = unparsed[0] as CSSVariableReferenceValue;
    expect(varRef.variable).toBe('--my-width');
    expect(varRef.fallback).toBeInstanceOf(CSSUnparsedValue);
    expect(varRef.fallback!.toString()).toBe('100px');
  });

  it('should parse transform values', () => {
    const val = parseCSSValue('transform', 'translate(10px, 20px) rotate(45deg)');
    expect(val).toBeInstanceOf(CSSTransformValue);
    const transform = val as CSSTransformValue;
    expect(transform.length).toBe(2);
    expect(transform[0]).toBeInstanceOf(CSSTranslate);
    expect(transform[1]).toBeInstanceOf(CSSRotate);
    expect(transform.toString()).toBe('translate(10px, 20px) rotate(45deg)');
  });

  it('should parse color values', () => {
    const valHex = parseCSSValue('color', '#ff0000');
    expect(valHex).toBeInstanceOf(CSSRGB);
    expect(valHex.toString()).toBe('rgb(255, 0, 0)');

    const valNamed = parseCSSValue('color', 'red');
    expect(valNamed).toBeInstanceOf(CSSKeywordValue);
    expect(valNamed.toString()).toBe('red');

    const valHsl = parseCSSValue('color', 'hsl(120 100% 50%)');
    expect(valHsl).toBeInstanceOf(CSSHSL);
    expect(valHsl.toString()).toBe('hsl(120deg 100% 50% / 100%)');
  });

  it('should parse all values in a comma-separated list', () => {
    const vals = parseAllCSSValues('background-image', 'url(bg.png), linear-gradient(red, blue)');
    expect(vals.length).toBe(2);
    expect(vals[0]).toBeInstanceOf(CSSImageValue);
    expect(vals[1]).toBeInstanceOf(CSSImageValue);
  });
});
