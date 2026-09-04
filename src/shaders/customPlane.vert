uniform float uTime;
varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;

void main() {
    vUv = uv;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Current wave equation parameters
    float freq = 1.0;
    float speed = 0.5;
    float amp = 0.25;

    float sx = sin(modelPosition.x * freq + uTime * speed);
    float cx = cos(modelPosition.x * freq + uTime * speed);
    float sz = sin(modelPosition.z * freq + uTime * speed);
    float cz = cos(modelPosition.z * freq + uTime * speed);

    // Calculate height displacement
    float elevation = sx * sz * amp;
    modelPosition.y += elevation;

    // Analytical partial derivatives for normal calculation: dy/dx and dy/dz
    float dydx = cx * sz * freq * amp;
    float dydz = sx * cz * freq * amp;

    // Un-displaced plane normal points UP (0, 1, 0)
    // Tangents: T_x = (1, dydx, 0), T_z = (0, dydz, 1)
    // Normal = normalize(T_z x T_x)
    vec3 objectNormal = normalize(vec3(-dydx, 1.0, -dydz));

    // Transform normal to view space for correct light calculations
    vNormal = normalize(mat3(modelMatrix) * objectNormal);

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    vElevation = elevation;
}