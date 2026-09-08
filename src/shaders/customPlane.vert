uniform sampler2D uTexture;
uniform float uMaxHeight;
uniform float uTime;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec2 vGradient;

struct TerrainData {
  float height;
  vec2 gradient;
};

TerrainData getTerrainData(vec2 uv) {
  vec2 texelSize = vec2(1.0 / 128.0);

  float hL = texture2D(uTexture, uv - vec2(texelSize.x, 0.0)).r * uMaxHeight;
  float hR = texture2D(uTexture, uv + vec2(texelSize.x, 0.0)).r * uMaxHeight;
  float hD = texture2D(uTexture, uv - vec2(0.0, texelSize.y)).r * uMaxHeight;
  float hU = texture2D(uTexture, uv + vec2(0.0, texelSize.y)).r * uMaxHeight;

  float height = texture2D(uTexture, uv).r * uMaxHeight;
  vec2 gradient = vec2(hL - hR, hD - hU);

  return TerrainData(height, gradient);
}

void main() {
  vUv = uv;

  TerrainData terrain = getTerrainData(uv);

  vec3 displacedPosition = position;
  displacedPosition.z += terrain.height;

  vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);

  vec3 objectNormal = normalize(vec3(terrain.gradient.x, terrain.gradient.y, 2.0));
  vNormal = normalize(mat3(modelMatrix) * objectNormal);

  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  vElevation = terrain.height / uMaxHeight;
  vGradient = terrain.gradient;
}