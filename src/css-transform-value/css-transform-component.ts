import { type CSSNumberish } from '../css-numeric-value';

export abstract class CSSTransformComponent {
  abstract is2D: boolean;
  abstract toMatrix(): DOMMatrix;
  abstract toString(): string;
}

export function isNumberValue(val: CSSNumberish): boolean {
  if (typeof val === 'number') return true;
  const type = val.type();
  return (type.length || 0) === 0 &&
         (type.angle || 0) === 0 &&
         (type.time || 0) === 0 &&
         (type.frequency || 0) === 0 &&
         (type.resolution || 0) === 0 &&
         (type.flex || 0) === 0 &&
         (type.percent || 0) === 0;
}
