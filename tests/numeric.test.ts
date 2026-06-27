import { describe, it, expect } from 'vitest';
import { CSSNumericValue, CSSUnitValue, CSSMathSum, CSSMathProduct, CSSMathNegate } from '../src/css-numeric-value';

describe('CSSUnitValue and Type Arithmetic', () => {
  it('should resolve types correctly', () => {
    const val = new CSSUnitValue(10, 'px');
    expect(val.type().length).toBe(1);
    expect(val.type().angle).toBe(0);

    const val2 = new CSSUnitValue(5, 's');
    expect(val2.type().time).toBe(1);
  });

  it('should support addition of compatible units', () => {
    const px = new CSSUnitValue(10, 'px');
    const cm = new CSSUnitValue(2.54, 'cm'); // 96px
    const sum = px.add(cm);
    expect(sum).toBeInstanceOf(CSSMathSum);
    expect(sum.type().length).toBe(1);
  });

  it('should throw when adding incompatible units', () => {
    const px = new CSSUnitValue(10, 'px');
    const deg = new CSSUnitValue(45, 'deg');
    expect(() => px.add(deg)).toThrow(TypeError);
  });

  it('should multiply types correctly', () => {
    const px1 = new CSSUnitValue(10, 'px');
    const px2 = new CSSUnitValue(20, 'px');
    const product = px1.mul(px2);
    expect(product).toBeInstanceOf(CSSMathProduct);
    expect(product.type().length).toBe(2);
  });

  it('should divide types correctly', () => {
    const px = new CSSUnitValue(10, 'px');
    const s = new CSSUnitValue(2, 's');
    const velocity = px.div(s);
    expect(velocity.type().length).toBe(1);
    expect(velocity.type().time).toBe(-1);
  });
});

describe('Unit Conversion (to, toSum)', () => {
  it('should convert compatible units', () => {
    const cm = new CSSUnitValue(2.54, 'cm');
    const px = cm.to('px');
    expect(px.value).toBeCloseTo(96, 5);
    expect(px.unit).toBe('px');

    const ms = new CSSUnitValue(1500, 'ms');
    const s = ms.to('s');
    expect(s.value).toBe(1.5);
    expect(s.unit).toBe('s');
  });

  it('should throw when converting incompatible units', () => {
    const px = new CSSUnitValue(10, 'px');
    expect(() => px.to('deg')).toThrow(TypeError);
  });
});

describe('Calculation Tree Simplification', () => {
  it('should simplify simple sums', () => {
    // We can parse a sum and check if it simplifies
    const sum = CSSNumericValue.parse('calc(10px + 20px + 30px)');
    // simplified sum of identical units is represented as a CSSMathSum containing a single CSSUnitValue
    expect(sum).toBeInstanceOf(CSSMathSum);
    expect(Array.from((sum as CSSMathSum).values).length).toBe(1);
    expect(Array.from((sum as CSSMathSum).values)[0]).toBeInstanceOf(CSSUnitValue);
    expect((Array.from((sum as CSSMathSum).values)[0] as CSSUnitValue).value).toBe(60);
    expect((Array.from((sum as CSSMathSum).values)[0] as CSSUnitValue).unit).toBe('px');
  });

  it('should simplify products of numbers', () => {
    const product = CSSNumericValue.parse('calc(2 * 3 * 5px)');
    expect(product).toBeInstanceOf(CSSMathSum);
    const values = Array.from((product as CSSMathSum).values);
    expect(values.length).toBe(1);
    expect(values[0]).toBeInstanceOf(CSSUnitValue);
    expect((values[0] as CSSUnitValue).value).toBe(30);
    expect((values[0] as CSSUnitValue).unit).toBe('px');
  });

  it('should simplify nested double negates', () => {
    const negate = CSSNumericValue.parse('calc(-(-10px))');
    expect(negate).toBeInstanceOf(CSSMathSum);
    const values = Array.from((negate as CSSMathSum).values);
    expect(values.length).toBe(1);
    expect(values[0]).toBeInstanceOf(CSSUnitValue);
    expect((values[0] as CSSUnitValue).value).toBe(10);
  });
});

describe('Equality (equals)', () => {
  it('should identify equal values with different units', () => {
    const cm = new CSSUnitValue(2.54, 'cm');
    const px = new CSSUnitValue(96, 'px');
    expect(cm.equals(px)).toBe(true);
  });

  it('should identify unequal values', () => {
    const px1 = new CSSUnitValue(10, 'px');
    const px2 = new CSSUnitValue(20, 'px');
    expect(px1.equals(px2)).toBe(false);
  });
});
