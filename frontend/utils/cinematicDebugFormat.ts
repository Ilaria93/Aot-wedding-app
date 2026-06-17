/** Formats a scalar for the Operation Ravenna debug overlay. */
export function formatDebugNumber(value: number, digits = 3): string {
  return value.toFixed(digits);
}

/** Formats a 3D tuple as comma-separated values for the debug overlay. */
export function formatDebugVector3(
  values: readonly [number, number, number],
  digits = 3,
): string {
  return values.map((component) => formatDebugNumber(component, digits)).join(', ');
}
