import { inverseLerp, lerp } from "three/src/math/MathUtils.js";

export function remap(value, fromMin, fromMax, toMin, toMax) {
  const t = inverseLerp(fromMin, fromMax, value);
  return lerp(toMin, toMax, t);
}
