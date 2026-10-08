import { useEffect, useRef, useState, useCallback } from "react";
import { Application } from "pixi.js";
import {
  createPixiApp,
  getRendererName,
  logGraphicsCapabilities,
  type ActiveRenderer,
  type PixiInitConfig,
} from "@/renderer";
import { useWindowLifecycle } from "./useWindowLifecycle";
import type { WindowLifecycleState } from "@/types";

export interface UsePixiAppOptions extends PixiInitConfig {
  /**
   * If true, enables automated 3-tier lifecycle management:
   * - VISIBLE_ACTIVE: Full 60+ FPS
   * - VISIBLE_INACTIVE: Throttled 30 FPS
   * - MINIMIZED_HIDDEN: 0 FPS, ticker halted, canvas detached from compositor (0% GPU)
   * Defaults to true.
   */
  manageLifecycle?: boolean;
}

export interface UsePixiAppResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  app: Application | null;
  isReady: boolean;
  isPaused: boolean;
  lifecycleState: WindowLifecycleState;
  rendererType: ActiveRenderer;
  error: Error | null;
  logCapabilities: () => Promise<void>;
  pauseRendering: () => void;
  resumeRendering: () => void;
}

export function usePixiApp(options: UsePixiAppOptions = {}): UsePixiAppResult {
  const { manageLifecycle = true, ...pixiConfig } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rendererType, setRendererType] = useState<ActiveRenderer>("Unknown");
  const [error, setError] = useState<Error | null>(null);

  const { lifecycleState } = useWindowLifecycle();

  const pauseRendering = useCallback(() => {
    const currentApp = appRef.current;
    if (currentApp?.ticker && currentApp.ticker.started) {
      currentApp.ticker.stop();
      if (currentApp.canvas) {
        currentApp.canvas.style.display = "none";
      }
      setIsPaused(true);
      console.log(
        "%c💤 [Summer Camp Engine] Rendering manually suspended (0% GPU Idle)",
        "color: #94a3b8; font-style: italic;"
      );
    }
  }, []);

  const resumeRendering = useCallback(() => {
    const currentApp = appRef.current;
    if (currentApp?.ticker) {
      if (currentApp.canvas) {
        currentApp.canvas.style.display = "block";
      }
      currentApp.ticker.maxFPS = 0;
      if (!currentApp.ticker.started) {
        currentApp.ticker.start();
      }
      setIsPaused(false);
      console.log(
        "%c⚡ [Summer Camp Engine] Rendering manually resumed",
        "color: #10b981; font-weight: bold;"
      );
    }
  }, []);

  // Initialize PixiJS Application
  useEffect(() => {
    let isCancelled = false;
    let localApp: Application | null = null;

    async function init() {
      if (!containerRef.current) return;

      try {
        const container = containerRef.current;
        // Explicitly set resizeTo: undefined so Pixi's internal un-guarded resize
        // does not trigger GPU rendering when minimized to 0x0 dimensions
        const newApp = await createPixiApp({
          targetElement: container,
          resizeTo: undefined,
          ...pixiConfig,
        });

        if (isCancelled) {
          newApp.destroy({ removeView: true });
          return;
        }

        localApp = newApp;
        appRef.current = newApp;

        // Ensure canvas view is mounted to container
        if (newApp.canvas && !container.contains(newApp.canvas)) {
          container.replaceChildren(newApp.canvas);
        }

        // Initial sync of canvas dimensions
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          newApp.renderer.resize(
            container.clientWidth,
            container.clientHeight,
            window.devicePixelRatio || 1
          );
        }

        const activeRenderer = getRendererName(newApp.renderer.type);
        setRendererType(activeRenderer);
        setApp(newApp);
        setIsReady(true);
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to initialize PixiJS v8 Application:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (localApp) {
        localApp.destroy({ removeView: true });
        appRef.current = null;
        setApp(null);
        setIsReady(false);
      }
    };
  }, []);

  const lifecycleStateRef = useRef<WindowLifecycleState>(lifecycleState);
  lifecycleStateRef.current = lifecycleState;

  // Guarded ResizeObserver to prevent any WebGPU/WebGL resize execution while minimized
  useEffect(() => {
    if (!app || !isReady || !containerRef.current) return;

    const container = containerRef.current;
    let rafId: number | null = null;

    const resizeObserver = new ResizeObserver((entries) => {
      // Strictly avoid resizing or rendering when minimized/hidden
      if (lifecycleStateRef.current === "MINIMIZED_HIDDEN") return;

      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (rafId !== null) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            if (app.renderer && lifecycleStateRef.current !== "MINIMIZED_HIDDEN") {
              app.renderer.resize(width, height, window.devicePixelRatio || 1);
            }
          });
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [app, isReady]);

  // Automated 3-Tier Window Lifecycle Management
  useEffect(() => {
    if (!app || !isReady || !manageLifecycle) return;

    const canvas = app.canvas as HTMLCanvasElement | undefined;

    switch (lifecycleState) {
      case "MINIMIZED_HIDDEN": {
        // 1. Halt the ticker completely (zero requestAnimationFrame, zero draw calls)
        if (app.ticker.started) {
          app.ticker.stop();
        }
        // 2. Detach canvas from DOM / Chromium DirectComposition visual tree
        // This stops WebView2 GPU process from maintaining swapchain compositing
        if (canvas) {
          canvas.style.display = "none";
        }
        setIsPaused(true);
        console.log(
          "%c💤 [Summer Camp Engine] Window Minimized — WebGPU/WebGL canvas detached & ticker halted (0% GPU)",
          "color: #94a3b8; font-style: italic;"
        );
        break;
      }

      case "VISIBLE_INACTIVE": {
        // 1. Restore canvas to visual tree
        if (canvas && canvas.style.display === "none") {
          canvas.style.display = "block";
        }
        // 2. Throttle ticker FPS to 30 to cut GPU/CPU workload by ~50%
        app.ticker.maxFPS = 30;
        // 3. Resume ticker if stopped
        if (!app.ticker.started) {
          app.ticker.start();
        }
        setIsPaused(false);
        console.log(
          "%c🔋 [Summer Camp Engine] Window Visible & Inactive — Throttled to 30 FPS power-save mode",
          "color: #38bdf8; font-style: italic;"
        );
        break;
      }

      case "VISIBLE_ACTIVE": {
        // 1. Restore canvas to visual tree
        if (canvas && canvas.style.display === "none") {
          canvas.style.display = "block";
        }
        // 2. Restore full frame rate (unthrottled / Vsync 60+ FPS)
        app.ticker.maxFPS = 0;

        // 3. Synchronize canvas size to container if returning from minimized
        if (containerRef.current && app.renderer) {
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          if (w > 0 && h > 0) {
            app.renderer.resize(w, h, window.devicePixelRatio || 1);
            app.render();
          }
        }

        // 4. Resume ticker if stopped
        if (!app.ticker.started) {
          app.ticker.start();
        }
        setIsPaused(false);
        console.log(
          "%c⚡ [Summer Camp Engine] Window Active & Focused — Resumed full 60+ FPS rendering",
          "color: #10b981; font-weight: bold;"
        );
        break;
      }
    }
  }, [lifecycleState, isReady, app, manageLifecycle]);

  const logCapabilities = useCallback(async () => {
    if (appRef.current) {
      await logGraphicsCapabilities(appRef.current);
    }
  }, []);

  return {
    containerRef,
    app,
    isReady,
    isPaused,
    lifecycleState,
    rendererType,
    error,
    logCapabilities,
    pauseRendering,
    resumeRendering,
  };
}
