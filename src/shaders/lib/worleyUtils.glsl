vec2 getWorleyCellPivot(vec2 cell, float cellSize) {
  vec2 jitter = hash22(cell + vec2(1.2355e5, -1.143e2));
  vec2 pivot = (cell + jitter) * cellSize;
  return pivot;
}
