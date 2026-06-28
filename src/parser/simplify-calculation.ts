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

/**
 * Implementation of `simplify a calculation tree` applied to CSSNumericValue
 * https://drafts.csswg.org/css-values-4/#simplify-a-calculation-tree
 */
export function simplifyCalculation(root: CSSNumericValue, info: Info = {}): CSSNumericValue {
  function simplifyNumericArray(values: any): CSSNumericValue[] {
    return Array.from(values).map((value: any) => simplifyCalculation(value, info));
  }

  // To simplify a calculation tree root:

  // 1. If root is a numeric value:
  if (root instanceof CSSUnitValue) {
    // 1. If root is a percentage that will be resolved against another value, and there is enough information
    //    available to resolve it, do so, and express the resulting numeric value in the appropriate canonical unit.
    //    Return the value.
    if (root.unit === "percent" && info.percentageReference) {
      const resolvedValue = (root.value / 100) * info.percentageReference.value;
      const resolvedUnit = info.percentageReference.unit;
      return new CSSUnitValue(resolvedValue, resolvedUnit);
    }

    // 2. If root is a dimension that is not expressed in its canonical unit, and there is enough information available
    //    to convert it to the canonical unit, do so, and return the value.
    // (Note: We resolve 'em' if fontSize is available. Other absolute units are not eagerly converted to preserve specified units).
    if (root instanceof CSSUnitValue && root.unit === 'em' && info.fontSize) {
      root = new CSSUnitValue(root.value * info.fontSize.value, info.fontSize.unit);
    }
    
    // 4. Otherwise, return root.
    return root;
  }

  // 3. If root is a <calc-keyword> that can be resolved, return what it resolves to, simplified.
  // https://drafts.csswg.org/css-values-4/#calc-constants
  if (root instanceof CSSKeywordValue) {
    if (root.value === 'e') {
      return new CSSUnitValue(Math.E, 'number');
    } else if (root.value === 'pi') {
      return new CSSUnitValue(Math.PI, 'number');
    }
    // 4. Otherwise, return root.
    return root;
  }

  // 2. If root is any other leaf node (not an operator node):
  if (!(root as any).operator) {
    //    1. If there is enough information available to determine its numeric value, return its value, expressed in the value’s canonical unit.
    //    2. Otherwise, return root.
    return root;
  }

  // 3. At this point, root is an operator node. Simplify all the calculation children of root.
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

  // 4. If root is an operator node that’s not one of the calc-operator nodes, and all of its calculation children are
  //    numeric values with enough information to compute the operation root represents, return the result of running
  //    root’s operation using its children, expressed in the result’s canonical unit.
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

  // 5. If root is a Min or Max node, attempt to partially simplify it:
  if (root instanceof CSSMathMin || root instanceof CSSMathMax) {
    const children = Array.from(root.values) as CSSNumericValue[];
    const [numeric, rest] = partition(children, (child) => child instanceof CSSUnitValue && child.unit !== "percent");
    const unitGroups = Array.from(groupBy(numeric as CSSUnitValue[], "unit").values());
    
    //    1. For each node child of root’s children:
    //       If child is a numeric value with enough information to compare magnitudes with another child of the same
    //       unit, and there are other children of root that are numeric children with the same unit, combine all such
    //       children with the appropriate operator per root, and replace child with the result, removing all other
    //       child nodes involved.
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

    //    2. If root has only one child, return the child.
    //       Otherwise, return root.
    if (children.length === 1) {
      return children[0]!;
    } else {
      return root;
    }
  }

  // If root is a Negate node:
  if (root instanceof CSSMathNegate) {
    // 1. If root’s child is a numeric value, return an equivalent numeric value, but with the value negated (0 - value).
    if (root.value instanceof CSSUnitValue) {
      return new CSSUnitValue(0 - root.value.value, root.value.unit);
    }
    // 2. If root’s child is a Negate node, return the child’s child.
    else if (root.value instanceof CSSMathNegate) {
      return root.value.value;
    }
    // 3. Return root.
    else {
      return root;
    }
  }

  // If root is an Invert node:
  if (root instanceof CSSMathInvert) {
    // 1. If root’s child is a number (not a percentage or dimension) return the reciprocal of the child’s value.
    // (Note: We don't simplify raw numbers to reciprocal if they are CSSUnitValue of 'number' here, but we could.
    //  Currently we only simplify double inverts).
    // 2. If root’s child is an Invert node, return the child’s child.
    if (root.value instanceof CSSMathInvert) {
      return root.value.value;
    }
    // 3. Return root.
    else {
      return root;
    }
  }

  // If root is a Sum node:
  if (root instanceof CSSMathSum) {
    let children: CSSNumericValue[] = [];
    // 1. For each of root’s children that are Sum nodes, replace them with their children.
    for (const value of root.values) {
      if (value instanceof CSSMathSum) {
        children.push(...value.values);
      } else {
        children.push(value);
      }
    }

    // 2. For each set of root’s children that are numeric values with identical units, remove those children and
    //    replace them with a single numeric value containing the sum of the removed nodes, and with the same unit.
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

    // 3. If root has only a single child at this point, return the child.
    //    Otherwise, return root.
    if (children.length === 1) {
      return children[0]!;
    } else {
      return new CSSMathSum(...children);
    }
  }

  // If root is a Product node:
  if (root instanceof CSSMathProduct) {
    let children: CSSNumericValue[] = [];
    // 1. For each of root’s children that are Product nodes, replace them with their children.
    for (const value of root.values) {
      if (value instanceof CSSMathProduct) {
        children.push(...value.values);
      } else {
        children.push(value);
      }
    }

    // 2. If root has multiple children that are numbers (not percentages or dimensions), remove them and replace them with
    //    a single number containing the product of the removed nodes.
    const [numbers, rest] = partition(children, (child) => child instanceof CSSUnitValue && child.unit === "number") as [CSSUnitValue[], CSSNumericValue[]];
    if (numbers.length > 1) {
      const product = numbers.reduce((a, item) => a * item.value, 1);
      children = [new CSSUnitValue(product, "number"), ...rest];
    }

    // 3. If root contains only two children, one of which is a number (not a percentage or dimension) and the other of
    //    which is a Sum whose children are all numeric values, multiply all of the Sum’s children by the number,
    //    then return the Sum.
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

    // 4. If root contains only numeric values and/or Invert nodes containing numeric values, and multiplying the types of
    //    all the children (noting that the type of an Invert node is the inverse of its child’s type) results in a type
    //    that matches any of the types that a math function can resolve to, return the result of multiplying all the values
    //    of the children (noting that the value of an Invert node is the reciprocal of its child’s value),
    //    expressed in the result’s canonical unit.
    if (children.every((child) => (child instanceof CSSUnitValue && isCanonical(child.unit)) ||
      (child instanceof CSSMathInvert && child.value instanceof CSSUnitValue && isCanonical(child.value.unit)))) {
      const sum = new CSSMathProduct(...children).toSum();
      if (sum && sum.values.length === 1) {
        return sum.values[0]!;
      }
    }

    // 5. Return root.
    return new CSSMathProduct(...children);
  }

  // Return root.
  return root;
}
