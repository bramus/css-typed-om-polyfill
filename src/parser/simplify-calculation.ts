import { CSSKeywordValue } from '../css-style-value';
import {
  CSSNumericValue,
  CSSUnitValue,
  CSSMathSum,
  CSSMathProduct,
  CSSMathNegate,
  CSSMathInvert,
  CSSMathMin,
  CSSMathMax,
  CSSMathClamp
} from '../css-numeric-value';
import { isCanonical } from '../utils';

export interface Info {
  percentageReference?: CSSUnitValue;
  fontSize?: CSSUnitValue;
}

function groupBy<T>(items: T[], key: keyof T): Map<any, T[]> {
  return items.reduce((groups, item) => {
    const groupKey = item[key];
    if (groups.has(groupKey)) {
      groups.get(groupKey)!.push(item);
    } else {
      groups.set(groupKey, [item]);
    }
    return groups;
  }, new Map<any, T[]>());
}

function partition<T>(items: T[], callbackFn: (item: T) => boolean): [T[], T[]] {
  const partA: T[] = [];
  const partB: T[] = [];
  for (const item of items) {
    if (callbackFn(item)) {
      partA.push(item);
    } else {
      partB.push(item);
    }
  }
  return [partA, partB];
}

export function simplifyCalculation(root: CSSNumericValue, info: Info = {}): CSSNumericValue {
  function simplifyNumericArray(values: any): CSSNumericValue[] {
    return Array.from(values).map((value: any) => simplifyCalculation(value, info));
  }

  if (root instanceof CSSUnitValue) {
    if (root.unit === "percent" && info.percentageReference) {
      const resolvedValue = (root.value / 100) * info.percentageReference.value;
      const resolvedUnit = info.percentageReference.unit;
      return new CSSUnitValue(resolvedValue, resolvedUnit);
    }

    const sum = root.toSum();
    if (sum && sum.values.length === 1) {
      root = sum.values[0]!;
    }
    
    if (root instanceof CSSUnitValue && root.unit === 'em' && info.fontSize) {
      root = new CSSUnitValue(root.value * info.fontSize.value, info.fontSize.unit);
    }
    return root;
  }

  if (root instanceof CSSKeywordValue) {
    if (root.value === 'e') {
      return new CSSUnitValue(Math.E, 'number');
    } else if (root.value === 'pi') {
      return new CSSUnitValue(Math.PI, 'number');
    }
    return root;
  }

  if (!(root as any).operator) {
    return root;
  }

  const operator = (root as any).operator;
  switch (operator) {
    case "sum":
      root = new CSSMathSum(...simplifyNumericArray((root as any).values));
      break;
    case "product":
      root = new CSSMathProduct(...simplifyNumericArray((root as any).values));
      break;
    case "negate":
      root = new CSSMathNegate(simplifyCalculation((root as any).value, info));
      break;
    case "clamp":
      root = new CSSMathClamp(
        simplifyCalculation((root as any).lower, info),
        simplifyCalculation((root as any).value, info),
        simplifyCalculation((root as any).upper, info)
      );
      break;
    case "invert":
      root = new CSSMathInvert(simplifyCalculation((root as any).value, info));
      break;
    case "min":
      root = new CSSMathMin(...simplifyNumericArray((root as any).values));
      break;
    case "max":
      root = new CSSMathMax(...simplifyNumericArray((root as any).values));
      break;
  }

  if (root instanceof CSSMathMin || root instanceof CSSMathMax) {
    const children = Array.from(root.values) as CSSNumericValue[];
    if (children.every(
      (child) => child instanceof CSSUnitValue && child.unit !== "percent" && isCanonical(child.unit) && child.unit ===
        (children[0] as CSSUnitValue).unit)) {

      const op = root.operator as 'min' | 'max';
      const result = Math[op](...children.map((c) => (c as CSSUnitValue).value));
      return new CSSUnitValue(result, (children[0] as CSSUnitValue).unit);
    }
  }

  if (root instanceof CSSMathMin || root instanceof CSSMathMax) {
    const children = Array.from(root.values) as CSSNumericValue[];
    const [numeric, rest] = partition(children, (child) => child instanceof CSSUnitValue && child.unit !== "percent");
    const unitGroups = Array.from(groupBy(numeric as CSSUnitValue[], "unit").values());
    
    const hasComparableChildren = unitGroups.some(group => group.length > 0);
    if (hasComparableChildren) {
      const op = root.operator as 'min' | 'max';
      const combinedGroups = unitGroups.map(group => {
        const result = Math[op](...group.map(({ value }) => value));
        return new CSSUnitValue(result, group[0]!.unit);
      });
      if (root instanceof CSSMathMin) {
        root = new CSSMathMin(...combinedGroups, ...rest);
      } else {
        root = new CSSMathMax(...combinedGroups, ...rest);
      }
    }

    if (children.length === 1) {
      return children[0]!;
    } else {
      return root;
    }
  }

  if (root instanceof CSSMathNegate) {
    if (root.value instanceof CSSUnitValue) {
      return new CSSUnitValue(0 - root.value.value, root.value.unit);
    } else if (root.value instanceof CSSMathNegate) {
      return root.value.value;
    } else {
      return root;
    }
  }

  if (root instanceof CSSMathInvert) {
    if (root.value instanceof CSSMathInvert) {
      return root.value.value;
    } else {
      return root;
    }
  }

  if (root instanceof CSSMathSum) {
    let children: CSSNumericValue[] = [];
    for (const value of root.values) {
      if (value instanceof CSSMathSum) {
        children.push(...value.values);
      } else {
        children.push(value);
      }
    }

    function sumValuesWithSameUnit(values: CSSNumericValue[]): CSSNumericValue[] {
      const numericValues = values.filter((c): c is CSSUnitValue => c instanceof CSSUnitValue);
      const nonNumericValues = values.filter((c) => !(c instanceof CSSUnitValue));

      const summedNumericValues = Array.from(groupBy(numericValues, "unit").entries())
        .map(([unit, unitValues]) => {
          const sum = unitValues.reduce((a, { value }) => a + value, 0);
          return new CSSUnitValue(sum, unit);
        });
      return [...nonNumericValues, ...summedNumericValues];
    }

    children = sumValuesWithSameUnit(children);

    if (children.length === 1) {
      return children[0]!;
    } else {
      return new CSSMathSum(...children);
    }
  }

  if (root instanceof CSSMathProduct) {
    let children: CSSNumericValue[] = [];
    for (const value of root.values) {
      if (value instanceof CSSMathProduct) {
        children.push(...value.values);
      } else {
        children.push(value);
      }
    }

    const [numbers, rest] = partition(children, (child) => child instanceof CSSUnitValue && child.unit === "number") as [CSSUnitValue[], CSSNumericValue[]];
    if (numbers.length > 1) {
      const product = numbers.reduce((a, item) => a * item.value, 1);
      children = [new CSSUnitValue(product, "number"), ...rest];
    }

    if (children.length === 2) {
      let numeric: CSSUnitValue | undefined;
      let sum: CSSMathSum | undefined;
      for (const child of children) {
        if (child instanceof CSSUnitValue && child.unit === "number") {
          numeric = child;
        } else if (child instanceof CSSMathSum && Array.from(child.values).every((c) => c instanceof CSSUnitValue)) {
          sum = child;
        }
      }
      if (numeric && sum) {
        return new CSSMathSum(
          ...Array.from(sum.values).map((value) => new CSSUnitValue((value as CSSUnitValue).value * numeric!.value, (value as CSSUnitValue).unit))
        );
      }
    }

    if (children.every((child) => (child instanceof CSSUnitValue && isCanonical(child.unit)) ||
      (child instanceof CSSMathInvert && child.value instanceof CSSUnitValue && isCanonical(child.value.unit)))) {
      const sum = new CSSMathProduct(...children).toSum();
      if (sum && sum.values.length === 1) {
        return sum.values[0]!;
      }
    }

    return new CSSMathProduct(...children);
  }

  return root;
}
