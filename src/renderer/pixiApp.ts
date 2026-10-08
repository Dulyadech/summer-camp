import { Application, RendererType, type ApplicationOptions } from "pixi.js";
import type { ActiveRenderer, GraphicsCapabilityInfo } from "@/types";

export type { ActiveRenderer, GraphicsCapabilityInfo };

export interface PixiInitConfig extends Partial<ApplicationOptions> {
  targetElement?: HTMLElement | HTMLCanvasElement;
}

/**
 * Returns a human-readable name for the active PixiJS RendererType.
 */
export function getRendererName(type: RendererType): ActiveRenderer {
  switch (type) {
    case RendererType.WEBGPU:
      return "WebGPU";
    case RendererType.WEBGL:
      return "WebGL";
    case RendererType.CANVAS:
      return "Canvas";
    default:
      return "Unknown";
  }
}

/**
 * Checks if the WebGPU API is present in the current browser/webview environment.
 */
export function isWebGPUSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator && navigator.gpu !== undefined;
}

/**
 * Analyzes and logs graphics capability info in the console to verify whether
 * WebGPU or WebGL is active, along with GPU adapter & hardware details.
 */
export async function logGraphicsCapabilities(app: Application): Promise<GraphicsCapabilityInfo> {
  const type = app.renderer.type;
  const activeRenderer = getRendererName(type);
  const isWebGPU = type === RendererType.WEBGPU;
  const isFallback = !isWebGPU;
  const webGPUSupported = isWebGPUSupported();

  const hardware: GraphicsCapabilityInfo["hardware"] = {};

  try {
    if (isWebGPU) {
      // Query WebGPU adapter info from PixiJS renderer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gpuSystem = (app.renderer as any).gpu;
      const adapter = gpuSystem?.adapter as GPUAdapter | undefined;
      const device = gpuSystem?.device as GPUDevice | undefined;

      if (adapter?.info) {
        hardware.vendor = adapter.info.vendor || "Generic WebGPU Vendor";
        hardware.architecture = adapter.info.architecture;
        hardware.description = adapter.info.description;
      } else if (typeof navigator !== "undefined" && navigator.gpu) {
        const directAdapter = await navigator.gpu.requestAdapter();
        if (directAdapter?.info) {
          hardware.vendor = directAdapter.info.vendor;
          hardware.architecture = directAdapter.info.architecture;
          hardware.description = directAdapter.info.description;
        }
      }

      if (device?.limits) {
        hardware.maxTextureSize = device.limits.maxTextureDimension2D;
      }
    } else {
      // Query WebGL context details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gl = (app.renderer as any).gl as (WebGLRenderingContext | WebGL2RenderingContext) | undefined;
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          hardware.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
          hardware.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string;
        } else {
          hardware.renderer = gl.getParameter(gl.RENDERER) as string;
          hardware.vendor = gl.getParameter(gl.VENDOR) as string;
        }
        hardware.webGLVersion = gl.getParameter(gl.VERSION) as string;
        hardware.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      }
    }
  } catch (err) {
    console.debug("[Graphics Capability Check] Unable to extract detailed GPU hardware metrics:", err);
  }

  const capabilityInfo: GraphicsCapabilityInfo = {
    activeRenderer,
    rendererType: type,
    isWebGPU,
    isFallback,
    webGPUSupported,
    resolution: app.renderer.resolution,
    screenSize: {
      width: app.screen.width,
      height: app.screen.height,
    },
    hardware,
  };

  // Structured Developer Console Logging
  console.group(
    "%c🎮 [Summer Camp Engine] Graphics Capability Verification",
    "color: #38bdf8; font-weight: bold; font-size: 13px; padding: 2px 0;"
  );

  if (isWebGPU) {
    console.log(
      "%c✓ Active Graphics Backend: WebGPU (Primary Hardware Accelerated)",
      "color: #10b981; font-weight: bold; font-size: 12px; background: rgba(16, 185, 129, 0.12); padding: 2px 6px; border-radius: 4px;"
    );
  } else {
    console.log(
      "%c⚡ Active Graphics Backend: WebGL (Automatic Fallback Active)",
      "color: #f59e0b; font-weight: bold; font-size: 12px; background: rgba(245, 158, 11, 0.12); padding: 2px 6px; border-radius: 4px;"
    );

    if (!webGPUSupported) {
      console.info(
        "ℹ️ Fallback Reason: WebGPU API is not enabled in this WebView/browser environment (navigator.gpu is unavailable). PixiJS safely initialized WebGL."
      );
    } else {
      console.info(
        "ℹ️ Fallback Reason: WebGPU API is available, but device/adapter creation was rejected. PixiJS automatically routed to WebGL."
      );
    }
  }

  console.table({
    "Graphics Backend": activeRenderer,
    "Mode": isWebGPU ? "Primary (WebGPU)" : "Automatic Fallback (WebGL)",
    "WebGPU API Detected": webGPUSupported ? "Yes (navigator.gpu present)" : "No (navigator.gpu undefined)",
    "GPU Hardware / Renderer": hardware.renderer || hardware.description || "Hardware Accelerator",
    "GPU Vendor": hardware.vendor || "Default Vendor",
    "WebGL / Driver Version": hardware.webGLVersion || hardware.driver || "Native",
    "Max 2D Texture Size": hardware.maxTextureSize ? `${hardware.maxTextureSize}px` : "Standard",
    "Screen Dimensions": `${app.screen.width} × ${app.screen.height} px`,
    "Canvas Resolution": `@${app.renderer.resolution}x (DPR: ${typeof window !== "undefined" ? window.devicePixelRatio : 1})`,
  });

  console.groupEnd();

  return capabilityInfo;
}

/**
 * Creates and initializes a PixiJS v8 Application configured with
 * WebGPU as the primary renderer and automatic WebGL fallback.
 */
export async function createPixiApp(options: PixiInitConfig = {}): Promise<Application> {
  const app = new Application();

  const { targetElement, resizeTo, ...restOptions } = options;

  const initOptions: Partial<ApplicationOptions> = {
    preference: ["webgpu", "webgl"],
    powerPreference: "high-performance",
    autoDensity: true,
    resolution: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    backgroundAlpha: 0,
    resizeTo: resizeTo !== undefined ? resizeTo : (targetElement instanceof HTMLElement ? targetElement : undefined),
    ...restOptions,
  };

  await app.init(initOptions);
  await logGraphicsCapabilities(app);

  return app;
}
