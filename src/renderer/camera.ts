import { Container } from "pixi.js";
import type { CameraShakeConfig, CameraState } from "@/types";

/**
 * 2D Camera controller for visual novels and game scenes (pan, zoom, shake effect).
 */
export class GameCamera {
  private targetContainer: Container;
  private state: CameraState = { x: 0, y: 0, zoom: 1, rotation: 0 };
  private shakeTimer = 0;
  private shakeIntensity = 0;

  constructor(targetContainer: Container) {
    this.targetContainer = targetContainer;
  }

  setZoom(zoom: number) {
    this.state.zoom = Math.max(0.1, zoom);
    this.targetContainer.scale.set(this.state.zoom);
  }

  panTo(x: number, y: number) {
    this.state.x = x;
    this.state.y = y;
    this.targetContainer.position.set(x, y);
  }

  shake(config: CameraShakeConfig) {
    this.shakeIntensity = config.intensity;
    this.shakeTimer = config.durationMs;
  }

  update(deltaMs: number) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaMs;
      const offsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.targetContainer.position.set(this.state.x + offsetX, this.state.y + offsetY);

      if (this.shakeTimer <= 0) {
        this.targetContainer.position.set(this.state.x, this.state.y);
      }
    }
  }

  getState(): CameraState {
    return { ...this.state };
  }
}
