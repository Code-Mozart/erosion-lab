float easeOut(float t) {
    float v = 1.0 - clamp(t, 0.0, 1.0);
    return 1.0 - v * v;
}