import { Container } from "pixi.js";
import type { ViewportConfig } from "@/types";

export const DEFAULT_VIEWPORT_CONFIG: ViewportConfig = {
  designWidth: 1920,
  designHeight: 1080,
  scaleMode: "contain",
};

/**
 * Manages game stage scaling, letterboxing, and resolution adaptation.
 */
export class GameViewport {
  readonly root: Container;
  readonly config: ViewportConfig;

  constructor(config: Partial<ViewportConfig> = {}) {
    this.root = new Container();
    this.config = { ...DEFAULT_VIEWPORT_CONFIG, ...config };
  }

  update(screenWidth: number, screenHeight: number) {
    const scaleX = screenWidth / this.config.designWidth;
    const scaleY = screenHeight / this.config.designHeight;

    let scale = 1;
    if (this.config.scaleMode === "contain") {
      scale = Math.min(scaleX, scaleY);
    } else if (this.config.scaleMode === "cover") {
      scale = Math.max(scaleX, scaleY);
    }

    this.root.scale.set(scale);

    // Center viewport container
    this.root.x = (screenWidth - this.config.designWidth * scale) / 2;
    this.root.y = (screenHeight - this.config.designHeight * scale) / 2;
  }
}
