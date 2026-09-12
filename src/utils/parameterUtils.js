export function getSetterName(parameter) {
  const str = parameter.identifier;
  const first = str.charAt(0).toUpperCase();
  const rest = str.slice(1);
  return `set${first}${rest}`;
}

export function getShaderUniformName(parameter) {
  const str = parameter.identifier;
  const first = str.charAt(0).toUpperCase();
  const rest = str.slice(1);
  return `u${first}${rest}`;
}

export function getDisplayName(parameter) {
  return parameter.displayName ?? identifierToDisplayName(parameter);
}

export function getStepWidth(parameter) {
  const fromSteps = (range, steps) => {
    if (!range || !steps) return undefined;
    return (range[1] - range[0]) / steps;
  };

  const fromPercent = () => {
    if (!parameter.type === "percent") return undefined;
    return fromSteps(getRange(parameter), parameter.steps ?? 100);
  };

  const fromDefault = () => {
    return fromSteps(parameter.range, 1000) ?? 0.01;
  };

  return (
    parameter.step ??
    fromSteps(parameter.range, parameter.steps) ??
    fromPercent() ??
    fromDefault()
  );
}

export function getRange(parameter) {
  return (
    parameter.range ?? (parameter.type === "percent" ? [0.0, 1.0] : [0, 10])
  );
}

function identifierToDisplayName(parameter) {
  const str = parameter.identifier;

  if (!str) {
    console.error(`undefined for parameter`, parameter);
  }

  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([a-z])/, (_, l) => l.toUpperCase());
}
