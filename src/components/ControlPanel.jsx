import { useState } from "react";
import { MAX_HEIGHT_BOUNDS, useTerrainStore } from "../store/useTerrainStore";
import { PARAMETERS } from "../config/parameters";
import {
  getDisplayName,
  getRange,
  getSetterName,
  getStepWidth,
} from "../utils/parameterUtils";

export default function ControlPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const uploadTexture = useTerrainStore((s) => s.uploadTexture);
  const reloadShader = useTerrainStore((s) => s.reloadShader);

  const handlePanelClick = (e) => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="control-panel">
      <div onClick={handlePanelClick}>
        <p>Controls {isCollapsed ? "▶" : "▼"}</p>
      </div>
      {!isCollapsed && (
        <>
          <hr />
          <div className="control-panel-content">
            <label>
              Heightmap Image:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadTexture(e.target.files[0])}
              />
            </label>

            {PARAMETERS.map((p) => (
              <ParameterControl key={p.identifier} parameter={p} />
            ))}

            <button onClick={reloadShader}>Reload Shader</button>
          </div>
        </>
      )}
    </div>
  );
}

function ParameterControl({ parameter: p }) {
  const value = useTerrainStore((s) => s[p.identifier]);
  const setter = useTerrainStore((s) => s[getSetterName(p)]);

  const name = getDisplayName(p);
  const parser = {
    int: parseInt,
    float: parseFloat,
    percent: parseFloat,
  }[p.type];
  const step = getStepWidth(p);
  const range = getRange(p);

  const createSlider = () => {
    return (
      <Slider
        displayValue={value}
        value={value}
        setter={setter}
        name={name}
        range={range}
        step={step}
        parser={parser}
      />
    );
  };

  const createLogarithmic = () => {
    const fromExp = (exp) => Math.round(Math.pow(2, exp));
    const toExp = (res) => Math.log2(res);

    const expRange = range.map(toExp);

    return (
      <Slider
        displayValue={value}
        value={toExp(value)}
        setter={setter}
        name={name}
        range={expRange}
        step={0.1}
        parser={(x) => parser(fromExp(x))}
      />
    );
  };

  const createSelect = () => {
    return (
      <Select
        displayValue={value}
        value={value}
        setter={setter}
        name={name}
        options={p.map}
      />
    );
  };

  if (p.type === "enum") {
    return createSelect();
  } else if (p.isLogarithmic) {
    return createLogarithmic();
  } else {
    return createSlider();
  }
}

function Slider({ displayValue, value, setter, name, range, step, parser }) {
  return (
    <label>
      {name}: {displayValue}
      <input
        type="range"
        min={range[0]}
        max={range[1]}
        step={step}
        value={value}
        onChange={(e) => setter(parser(e.target.value))}
      />
    </label>
  );
}

function Select({ value, setter, name, options }) {
  return (
    <label>
      {name}:
      <select value={value} onChange={(e) => setter(parseInt(e.target.value))}>
        {options.map((opt, index) => (
          <option key={index} value={index}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
