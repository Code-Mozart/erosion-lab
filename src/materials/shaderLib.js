import { ShaderChunk } from "three";
import hash22 from "../shaders/lib/hash22.glsl";
import worleyUtils from "../shaders/lib/worleyUtils.glsl";
import easeOut from "../shaders/lib/easeOut.glsl";
import inverseLerp from "../shaders/lib/inverseLerp.glsl";

export function loadShaderLib() {
  ShaderChunk.hash22 = hash22;
  ShaderChunk.worleyUtils = worleyUtils;
  ShaderChunk.easeOut = easeOut;
  ShaderChunk.inverseLerp = inverseLerp;
}
