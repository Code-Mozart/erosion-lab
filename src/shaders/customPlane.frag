uniform float uMaxHeight;

varying vec2 vUv;
varying float vElevation;
varying vec2 vGradient;
varying vec3 vNormal;
varying vec2 vCellID;

// Enum Mode Constants
#define MODE_SHADED 0
#define MODE_ELEVATION 1
#define MODE_GRADIENTS 2
#define MODE_STEEPNESS 3
#define MODE_NORMALS 4
#define MODE_WORLEY 5

uniform int uDebugMode;

// Automatically injected by Three.js when material.lights = true
#include <common>
#include <lights_pars_begin>

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
            vec2 absGrad = abs(vGradient) / uMaxHeight;
            finalColor = vec3(absGrad, 0.0);
            break;
        }

        case MODE_STEEPNESS: {
            float S = length(vGradient) / uMaxHeight;
            
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
            finalColor = vec3(vCellID, 0.0);
            break;
        }

        case MODE_SHADED:
        default: {
            vec3 baseColor = vec3(vElevation);

            vec3 lightDirView = directionalLights[0].direction;
            vec3 lightDirWorld = normalize(lightDirView * mat3(viewMatrix));
            vec3 lightColor = directionalLights[0].color;

            float diffuse = max(dot(N, lightDirWorld), 0.0);

            // Safety fallback: if diffuse is 0 because the light vector direction was negated in Three.js,
            // take the absolute value or test with -lightDirWorld
            if (diffuse == 0.0) {
                diffuse = max(dot(N, -lightDirWorld), 0.0);
            }

            finalColor = baseColor * (diffuse * lightColor) + ambientLightColor;
            break;
        }
    }

    gl_FragColor = vec4(finalColor, 1.0);
}