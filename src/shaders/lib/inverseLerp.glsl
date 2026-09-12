float inverseLerp(float a, float b, float v) {
    return clamp((v - a) / (b - a), 0.0, 1.0);
}