// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { CSSTransformValue, CSSTranslate, CSSRotate, CSSScale } from '../../src/css-transform-value';
import { CSSUnitValue } from '../../src/css-numeric-value';
import { CSSUnparsedValue } from '../../src/css-style-value';

class MockDOMMatrix {
  public a = 1; public b = 0; public c = 0; public d = 1; public e = 0; public f = 0;
  public m11 = 1; public m12 = 0; public m13 = 0; public m14 = 0;
  public m21 = 0; public m22 = 1; public m23 = 0; public m24 = 0;
  public m31 = 0; public m32 = 0; public m33 = 1; public m34 = 0;
  public m41 = 0; public m42 = 0; public m43 = 0; public m44 = 1;
  public is2D = true;

  constructor(init?: any) {
    if (Array.isArray(init)) {
      if (init.length === 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3]; this.e = init[4]; this.f = init[5];
        this.m11 = this.a; this.m12 = this.b; this.m21 = this.c; this.m22 = this.d; this.m41 = this.e; this.m42 = this.f;
      } else if (init.length === 16) {
        this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3];
        this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7];
        this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11];
        this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15];
        this.is2D = false;
      }
    } else if (init && typeof init === 'object') {
      Object.assign(this, init);
    }
  }

  translateSelf(x: number, y: number, z = 0) {
    this.m41 += x; this.m42 += y; this.m43 += z;
    this.e = this.m41; this.f = this.m42;
    if (z !== 0) this.is2D = false;
    return this;
  }

  scaleSelf(x: number, y: number, z = 1) {
    this.a *= x; this.d *= y;
    this.m11 = this.a; this.m22 = this.d;
    this.m33 *= z;
    if (z !== 1) this.is2D = false;
    return this;
  }

  rotateSelf(angle: number) {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const a = this.a, b = this.b, c = this.c, d = this.d;
    this.a = a * cos + c * sin;
    this.b = b * cos + d * sin;
    this.c = -a * sin + c * cos;
    this.d = -b * sin + d * cos;
    this.m11 = this.a; this.m12 = this.b; this.m21 = this.c; this.m22 = this.d;
    return this;
  }

  rotateAxisAngleSelf(x: number, y: number, z: number, angle: number) {
    this.is2D = false;
    return this;
  }

  multiplySelf(other: MockDOMMatrix) {
    const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f;
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    this.m11 = this.a; this.m12 = this.b; this.m21 = this.c; this.m22 = this.d;
    this.m41 = this.e; this.m42 = this.f;
    return this;
  }
}

if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = MockDOMMatrix;
}

describe('CSSTransformValue and Components', () => {
  it('should construct translate correctly', () => {
    const x = new CSSUnitValue(10, 'px');
    const y = new CSSUnitValue(20, 'px');
    const translate = new CSSTranslate(x, y);

    expect(translate.x).toBe(x);
    expect(translate.y).toBe(y);
    expect(translate.is2D).toBe(true);
    expect(translate.toString()).toBe('translate(10px, 20px)');

    const matrix = translate.toMatrix();
    expect(matrix.m41).toBe(10);
    expect(matrix.m42).toBe(20);
    expect(matrix.is2D).toBe(true);
  });

  it('should construct rotate correctly', () => {
    const angle = new CSSUnitValue(90, 'deg');
    const rotate = new CSSRotate(angle);

    expect(rotate.angle).toBe(angle);
    expect(rotate.is2D).toBe(true);
    expect(rotate.toString()).toBe('rotate(90deg)');

    const matrix = rotate.toMatrix();
    expect(matrix.a).toBeCloseTo(0, 5);
    expect(matrix.b).toBeCloseTo(1, 5);
    expect(matrix.c).toBeCloseTo(-1, 5);
    expect(matrix.d).toBeCloseTo(0, 5);
  });

  it('should construct scale correctly', () => {
    const scale = new CSSScale(2, 3);
    expect(scale.x).toEqual(new CSSUnitValue(2, 'number'));
    expect(scale.y).toEqual(new CSSUnitValue(3, 'number'));
    expect(scale.is2D).toBe(true);
    expect(scale.toString()).toBe('scale(2, 3)');

    const matrix = scale.toMatrix();
    expect(matrix.a).toBe(2);
    expect(matrix.d).toBe(3);
  });

  it('should multiply matrices in CSSTransformValue', () => {
    const translate = new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 'px'));
    const scale = new CSSScale(2, 2);
    const transform = new CSSTransformValue([translate, scale]);

    expect(transform.is2D).toBe(true);
    expect(transform.toString()).toBe('translate(10px, 20px) scale(2, 2)');

    const matrix = transform.toMatrix();
    // The combined matrix should scale then translate, or vice versa depending on multiplication order.
    // CSS transforms are applied right-to-left, which means:
    // matrix = translate.toMatrix() * scale.toMatrix()
    // Let's verify:
    // translate(10, 20) * scale(2, 2)
    // Point (0,0) -> scale -> (0,0) -> translate -> (10,20)
    // Point (1,1) -> scale -> (2,2) -> translate -> (12,22)
    expect(matrix.m41).toBe(10);
    expect(matrix.m42).toBe(20);
    expect(matrix.a).toBe(2);
    expect(matrix.d).toBe(2);
  });

  describe('Validation and is2D', () => {
    it('CSSTranslate validation', () => {
      expect(() => new CSSTranslate(new CSSUnitValue(10, 'deg'), new CSSUnitValue(20, 'px'))).toThrow(TypeError);
      expect(() => new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 's'))).toThrow(TypeError);
      expect(() => new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 'px'), new CSSUnitValue(30, 'percent'))).toThrow(TypeError);
      expect(() => new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 'px'), new CSSUnitValue(30, 'deg'))).toThrow(TypeError);
      
      const t = new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 'px'));
      expect(() => t.x = new CSSUnitValue(10, 'deg')).toThrow(TypeError);
      expect(() => t.z = new CSSUnitValue(10, 'percent')).toThrow(TypeError);
    });

    it('CSSTranslate is2D behavior', () => {
      const t1 = new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 'px'));
      expect(t1.is2D).toBe(true);
      
      const t2 = new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 'px'), new CSSUnitValue(0, 'px'));
      expect(t2.is2D).toBe(false);
      
      t2.is2D = true;
      expect(t2.is2D).toBe(true);
      expect(t2.z.value).toBe(0);
      
      t2.is2D = false;
      expect(t2.is2D).toBe(false);
    });

    it('CSSRotate validation', () => {
      expect(() => new CSSRotate(new CSSUnitValue(10, 'px'))).toThrow(TypeError);
      expect(() => new CSSRotate(1, 2, 3, new CSSUnitValue(10, 'px'))).toThrow(TypeError);
      expect(() => new CSSRotate(new CSSUnitValue(1, 'px'), 2, 3, new CSSUnitValue(10, 'deg'))).toThrow(TypeError);
    });

    it('CSSUnparsedValue bounds check', () => {
      const uv = new CSSUnparsedValue(['foo', 'bar']);
      expect(() => uv[2] = 'baz').toThrow(RangeError);
    });

    it('CSSTransformValue bounds check', () => {
      const translate = new CSSTranslate(new CSSUnitValue(10, 'px'), new CSSUnitValue(20, 'px'));
      const transform = new CSSTransformValue([translate]);
      expect(() => transform[1] = translate).toThrow(RangeError);
    });
  });
});
