float easeOut(float t, float power) {
  float v = 1.0 - clamp(t, 0.0, 1.0);
  return 1.0 - pow(v, power);
}
