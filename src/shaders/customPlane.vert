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

  float hL = texture2D(uTexture, uv - vec2(texelSize.x, 0.0)).r;
  float hR = texture2D(uTexture, uv + vec2(texelSize.x, 0.0)).r;
  float hD = texture2D(uTexture, uv - vec2(0.0, texelSize.y)).r;
  float hU = texture2D(uTexture, uv + vec2(0.0, texelSize.y)).r;

  float height = texture2D(uTexture, uv).r;
  vec2 gradient = vec2(hR - hL, hU - hD) / (2.0 * texelSize.x);

  return TerrainData(height, gradient);
}

TerrainData octave(TerrainData terrain, vec2 p, float frequency, float amplitude) {
  // 1. Get length of current gradient (steepness)
  float len = length(terrain.gradient);
  
  // Avoid division by zero if terrain is completely flat
  if (len < 0.0001) return terrain;

  // 2. Compute normalized perpendicular vector
  vec2 perp = vec2(-terrain.gradient.y, terrain.gradient.x) / len;
  
  // 3. Project position to get distance across the stripe
  float d = dot(p, perp);
  
  // 4. Height offset (Cosine wave)
  float heightOffset = amplitude * cos(d * frequency);
  
  // 5. Slope/Gradient offset (Negative Sine wave scaled by frequency & direction)
  vec2 gradientOffset = -amplitude * frequency * sin(d * frequency) * perp;
  
  // 6. Combine both
  return TerrainData(
      terrain.height + heightOffset,
      terrain.gradient + gradientOffset
  );
}

TerrainData erode(TerrainData terrain, vec2 p) {
  int octaves = 1;

  float frequency = 5.0;
  float amplitude = 0.2;

  float lacunarity = 2.0;
  float persistence = 0.5;

  int i = 0;
  while (i < octaves) {
    terrain = octave(terrain, p, frequency, amplitude);

    frequency *= lacunarity;
    amplitude *= persistence;
    i += 1;
  }

  return terrain;
}

void main() {
  vUv = uv;

  TerrainData terrain = getTerrainData(uv);

  vec2 uvOffset = uv - vec2(0.5);
  float distUv = max(length(uvOffset), 0.0001); 
  float worldScale = max(length(position.xy) / distUv, 0.0001);

  terrain.height *= uMaxHeight;
  terrain.gradient *= (uMaxHeight / worldScale);

  terrain = erode(terrain, position.xy);

  vec3 displacedPosition = position;
  displacedPosition.z += terrain.height;

  vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);

  vec3 objectNormal = normalize(vec3(-terrain.gradient.x, -terrain.gradient.y, 1.0));
  vNormal = normalize(mat3(modelMatrix) * objectNormal);

  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  vElevation = terrain.height / uMaxHeight;
  vGradient = terrain.gradient;
}