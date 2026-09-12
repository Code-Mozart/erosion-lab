export const PARAMETERS = [
  {
    displayName: "Height Scale",
    identifier: "maxHeight",
    type: "percent",
    initialValue: 0.25,
    steps: 100,
  },
  {
    identifier: "resolution",
    isShaderUniform: false,
    isLogarithmic: true,
    type: "int",
    range: [2, 1024],
    initialValue: 128,
  },
  {
    identifier: "frequency",
    type: "float",
    range: [0.1, 50.0],
    initialValue: 8.0,
  },
  {
    identifier: "octaves",
    type: "int",
    range: [0, 10],
    initialValue: 4,
  },
  {
    identifier: "blendRadius",
    type: "float",
    range: [0.0, 3.0],
    initialValue: 1.5,
  },
  {
    identifier: "displayMode",
    type: "enum",
    map: [
      "Colored Terrain",
      "Shaded Terrain",
      "Elevation Map",
      "Gradients",
      "Steepness",
      "Normals",
      "Debug Cell Noise",
    ],
    initialValue: "Shaded Terrain",
  },
];
