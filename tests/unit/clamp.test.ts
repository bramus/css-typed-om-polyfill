import { describe, it, expect } from 'vitest';
import { CSSNumericValue, CSSUnitValue, CSSMathClamp } from '../../src/css-numeric-value';

describe('CSSMathClamp', () => {
  it('should construct correctly with compatible units', () => {
    const min = new CSSUnitValue(10, 'px');
    const val = new CSSUnitValue(15, 'px');
    const max = new CSSUnitValue(20, 'px');
    const clamp = new CSSMathClamp(min, val, max);

    expect(clamp).toBeInstanceOf(CSSMathClamp);
    expect(clamp.lower).toBe(min);
    expect(clamp.value).toBe(val);
    expect(clamp.upper).toBe(max);
    expect(clamp.type().length).toBe(1);
  });

  it('should construct correctly with mixed but compatible units', () => {
    const min = new CSSUnitValue(1, 'cm');
    const val = new CSSUnitValue(15, 'px');
    const max = new CSSUnitValue(1, 'in');
    const clamp = new CSSMathClamp(min, val, max);

    expect(clamp).toBeInstanceOf(CSSMathClamp);
    expect(clamp.type().length).toBe(1);
  });

  it('should throw when constructing with incompatible units', () => {
    const min = new CSSUnitValue(10, 'px');
    const val = new CSSUnitValue(45, 'deg');
    const max = new CSSUnitValue(20, 'px');
    expect(() => new CSSMathClamp(min, val, max)).toThrow(TypeError);
  });

  it('should serialize correctly', () => {
    const min = new CSSUnitValue(10, 'px');
    const val = new CSSUnitValue(15, 'px');
    const max = new CSSUnitValue(20, 'px');
    const clamp = new CSSMathClamp(min, val, max);
    expect(clamp.toString()).toBe('clamp(10px, 15px, 20px)');
  });

  it('should parse clamp() correctly', () => {
    const parsed = CSSNumericValue.parse('clamp(10px, 15px, 20px)');
    expect(parsed).toBeInstanceOf(CSSMathClamp);
    const clamp = parsed as CSSMathClamp;
    expect(clamp.lower).toBeInstanceOf(CSSUnitValue);
    expect((clamp.lower as CSSUnitValue).value).toBe(10);
    expect((clamp.lower as CSSUnitValue).unit).toBe('px');
    expect(clamp.value).toBeInstanceOf(CSSUnitValue);
    expect((clamp.value as CSSUnitValue).value).toBe(15);
    expect((clamp.value as CSSUnitValue).unit).toBe('px');
    expect(clamp.upper).toBeInstanceOf(CSSUnitValue);
    expect((clamp.upper as CSSUnitValue).value).toBe(20);
    expect((clamp.upper as CSSUnitValue).unit).toBe('px');
  });

  it('should parse clamp() with mixed compatible units', () => {
    const parsed = CSSNumericValue.parse('clamp(1cm, 15px, 1in)');
    expect(parsed).toBeInstanceOf(CSSMathClamp);
    const clamp = parsed as CSSMathClamp;
    expect((clamp.lower as CSSUnitValue).unit).toBe('cm');
    expect((clamp.value as CSSUnitValue).unit).toBe('px');
    expect((clamp.upper as CSSUnitValue).unit).toBe('in');
  });

  it('should throw when parsing clamp() with incompatible units', () => {
    expect(() => CSSNumericValue.parse('clamp(10px, 45deg, 20px)')).toThrow(TypeError);
  });

  it('should throw when parsing clamp() with wrong number of arguments', () => {
    expect(() => CSSNumericValue.parse('clamp(10px, 20px)')).toThrow(SyntaxError);
    expect(() => CSSNumericValue.parse('clamp(10px, 20px, 30px, 40px)')).toThrow(SyntaxError);
  });
});
