/**
 * Renderer, Camera, and Viewport Types
 */

import type { RendererType } from "pixi.js";

export type ActiveRenderer = "WebGPU" | "WebGL" | "Canvas" | "Unknown";

export interface ViewportConfig {
  designWidth: number;
  designHeight: number;
  scaleMode: "contain" | "cover" | "stretch";
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export interface CameraShakeConfig {
  intensity: number;
  durationMs: number;
}

export type LayerType = "background" | "scenery" | "characters" | "foreground" | "vfx";

export interface GraphicsCapabilityInfo {
  activeRenderer: ActiveRenderer;
  rendererType: RendererType;
  isWebGPU: boolean;
  isFallback: boolean;
  webGPUSupported: boolean;
  resolution: number;
  screenSize: { width: number; height: number };
  hardware: {
    vendor?: string;
    renderer?: string;
    driver?: string;
    description?: string;
    architecture?: string;
    webGLVersion?: string;
    maxTextureSize?: number;
  };
}
