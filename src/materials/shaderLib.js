import { ShaderChunk } from "three";
import hash22 from "../shaders/lib/hash22.glsl";
import worleyUtils from "../shaders/lib/worleyUtils.glsl";

export function loadShaderLib() {
  ShaderChunk.hash22 = hash22;
  ShaderChunk.worleyUtils = worleyUtils;
}
