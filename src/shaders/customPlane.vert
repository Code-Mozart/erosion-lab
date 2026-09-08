uniform sampler2D uTexture;
uniform float uMaxHeight;
uniform float uTime;
uniform float uCellSize;
uniform float uFrequency;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec2 vGradient;
varying vec2 vCellID;

struct TerrainData {
  float height;
  vec2 gradient;
};

struct WorleyData {
  vec2 cellPivot;
  float distance;
};

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

WorleyData worleyNoise(vec2 p, float cellSize) {
  vec2 centerCell = floor(p / cellSize);

  vec2 closestPivot = vec2(1e30);
  float closestDistance = 1e30;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 cell = centerCell + offset;
      vec2 jitter = hash22(cell + vec2(1.2355e5, -1.143e2));
      vec2 pivot = (cell + jitter) * cellSize;

      float distance = length(p - pivot);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPivot = pivot;
      }
    }  
  }

  return WorleyData(closestPivot, closestDistance);
}

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

TerrainData octave(TerrainData terrain, vec2 p, float frequency, float cellSize, float amplitude) {
  // 1. Get length of current gradient (steepness)
  float len = length(terrain.gradient);
  
  // Avoid division by zero if terrain is completely flat
  if (len < 0.0001) return terrain;

  // 2. Compute normalized perpendicular vector
  vec2 perp = vec2(-terrain.gradient.y, terrain.gradient.x) / len;
  
  // 3. Project position to get distance across the stripe
  WorleyData worley = worleyNoise(p, cellSize);
  float d = dot(p - worley.cellPivot, perp);
  
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

  float frequency = uFrequency;
  float cellSize = uCellSize;
  float amplitude = 0.2;

  float lacunarity = 2.0;
  float persistence = 0.5;

  int i = 0;
  while (i < octaves) {
    terrain = octave(terrain, p, frequency, cellSize, amplitude);

    frequency *= lacunarity;
    cellSize /= lacunarity;
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

  WorleyData worley = worleyNoise(position.xy, uCellSize);
  vCellID = hash22(worley.cellPivot);

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