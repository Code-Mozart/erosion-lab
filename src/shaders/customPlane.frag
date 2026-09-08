uniform float uMaxHeight;
uniform float uCellSize;

varying vec2 vUv;
varying float vElevation;
varying vec2 vGradient;
varying vec3 vNormal;
varying vec2 vPosition;

// Enum Mode Constants
#define MODE_COLORED 0
#define MODE_SHADED 1
#define MODE_ELEVATION 2
#define MODE_GRADIENTS 3
#define MODE_STEEPNESS 4
#define MODE_NORMALS 5
#define MODE_WORLEY 6

#define SNOW_COLOR vec3(1.2, 1.2, 1.1)
#define GRASS_COLOR vec3(0.4, 0.76, 0.1)
#define GRASS_COLOR_2 vec3(0.3, 0.65, 0.2)
#define STONE_COLOR vec3(0.4, 0.4, 0.4)

uniform int uDebugMode;

// Automatically injected by Three.js when material.lights = true
#include <common>
#include <lights_pars_begin>

#include <hash22>
#include <worleyUtils>

struct WorleyData {
  vec2 cellPivot;
  float distance;
};

WorleyData worleyNoise(vec2 p, float cellSize) {
  vec2 centerCell = floor(p / cellSize);

  vec2 closestPivot = vec2(1e30);
  float closestDistance = 1e30;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 cell = centerCell + offset;
      vec2 pivot = getWorleyCellPivot(cell, cellSize);

      float distance = length(p - pivot);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPivot = pivot;
      }
    }  
  }

  return WorleyData(closestPivot, closestDistance);
}

vec3 shaded(vec3 N, vec3 baseColor) {
    vec3 lightDirView = directionalLights[0].direction;
    vec3 lightDirWorld = normalize(lightDirView * mat3(viewMatrix));
    vec3 lightColor = directionalLights[0].color;

    float diffuse = max(dot(N, lightDirWorld), 0.0);

    // Safety fallback: if diffuse is 0 because the light vector direction was negated in Three.js,
    // take the absolute value or test with -lightDirWorld
    if (diffuse == 0.0) {
        diffuse = max(dot(N, -lightDirWorld), 0.0);
    }

    return baseColor * (diffuse * lightColor) + ambientLightColor;
}

void main() {
    // Re-normalize interpolated WORLD SPACE normal vector
    vec3 N = normalize(vNormal);

    vec3 finalColor;

    switch (uDebugMode) {
        case MODE_ELEVATION: {
            // Mode 1: Grayscale Elevation Map
            finalColor = vec3(vElevation);
            break;
        }

        case MODE_GRADIENTS: {
            vec2 absGrad = abs(vGradient);
            finalColor = vec3(absGrad, 0.0);
            break;
        }

        case MODE_STEEPNESS: {
            float S = length(vGradient);
            
            float red   = smoothstep(0.0, 0.1, S);
            float green = smoothstep(0.1, 0.4, S);
            float blue  = smoothstep(0.4, 1.0, S);

            finalColor = vec3(red, green, blue);
            break;
        }

        case MODE_NORMALS: {
            finalColor = N * 0.5 + 0.5;
            break;
        }

        case MODE_WORLEY: {
            WorleyData worley = worleyNoise(vPosition, uCellSize);
            vec2 cellID = hash22(worley.cellPivot);
            finalColor = vec3(cellID, 0.0);
            break;
        }

        case MODE_COLORED: {
            float slope = length(vGradient);
            float slopeMask = smoothstep(0.1, 0.11, slope);
            float snowMask = smoothstep(0.4, 0.55, vElevation);

            vec3 grassColor = mix(GRASS_COLOR, GRASS_COLOR_2, smoothstep(0.0, 0.25, vElevation));

            vec3 groundColor = snowMask * SNOW_COLOR + (1.0 - snowMask) * grassColor;
            vec3 color = slopeMask * STONE_COLOR + (1.0 - slopeMask) * groundColor;
            finalColor = shaded(N, color);
            break;
        }

        case MODE_SHADED:
        default: {
            vec3 baseColor = vec3(vElevation);
            finalColor = shaded(N, baseColor);
            break;
        }
    }

    gl_FragColor = vec4(finalColor, 1.0);
}