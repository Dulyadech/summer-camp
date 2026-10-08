import { Container } from "pixi.js";
import type { LayerType } from "@/types";

/**
 * Manages layer hierarchy (background, scenery, characters, foreground, vfx).
 */
export class SpriteManager {
  readonly root: Container;
  readonly layers: Record<LayerType, Container>;

  constructor() {
    this.root = new Container();

    this.layers = {
      background: new Container(),
      scenery: new Container(),
      characters: new Container(),
      foreground: new Container(),
      vfx: new Container(),
    };

    this.root.addChild(this.layers.background);
    this.root.addChild(this.layers.scenery);
    this.root.addChild(this.layers.characters);
    this.root.addChild(this.layers.foreground);
    this.root.addChild(this.layers.vfx);
  }

  getLayer(layer: LayerType): Container {
    return this.layers[layer];
  }

  clearLayer(layer: LayerType) {
    this.layers[layer].removeChildren();
  }

  clearAll() {
    (Object.keys(this.layers) as LayerType[]).forEach((layer) => {
      this.layers[layer].removeChildren();
    });
  }
}
