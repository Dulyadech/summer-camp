import { useEffect, useState, useCallback, useRef } from "react";
import type { WindowLifecycleState } from "@/types";

export interface WindowLifecycleResult {
  lifecycleState: WindowLifecycleState;
  isActive: boolean;
  isInactive: boolean;
  isMinimized: boolean;
}

/**
 * Robust Window Lifecycle Manager for Tauri v2 Desktop & Web fallback.
 * Accurately determines:
 * - VISIBLE_ACTIVE: Window is on-screen and focused (full 60+ FPS performance)
 * - VISIBLE_INACTIVE: Window is on-screen but unfocused (throttled ~30 FPS to save power)
 * - MINIMIZED_HIDDEN: Window is minimized to taskbar or hidden (100% idle, zero GPU/render loop)
 */
export function useWindowLifecycle(): WindowLifecycleResult {
  const [lifecycleState, setLifecycleState] = useState<WindowLifecycleState>("VISIBLE_ACTIVE");
  const unlistenFocusRef = useRef<(() => void) | null>(null);
  const unlistenResizeRef = useRef<(() => void) | null>(null);

  const evaluateState = useCallback(async (): Promise<WindowLifecycleState> => {
    let tauriMinimized = false;
    let tauriFocused: boolean | null = null;

    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const currentWin = getCurrentWindow();
      if (typeof currentWin.isMinimized === "function") {
        tauriMinimized = await currentWin.isMinimized();
      }
      if (typeof currentWin.isFocused === "function") {
        tauriFocused = await currentWin.isFocused();
      }
    } catch {
      // In web browser or Tauri API unavailable
    }

    // 1. Minimized or fully hidden state check
    const isDimensionZero = typeof window !== "undefined" && window.innerWidth === 0 && window.innerHeight === 0;
    const isDocHidden = typeof document !== "undefined" && document.hidden;

    if (tauriMinimized || isDocHidden || isDimensionZero) {
      return "MINIMIZED_HIDDEN";
    }

    // 2. Focused vs Unfocused state check
    const docFocused = typeof document !== "undefined" && document.hasFocus();
    const hasFocus = tauriFocused !== null ? (tauriFocused || docFocused) : docFocused;

    return hasFocus ? "VISIBLE_ACTIVE" : "VISIBLE_INACTIVE";
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const updateState = async () => {
      const newState = await evaluateState();
      if (isCancelled) return;

      setLifecycleState((prev) => {
        if (prev !== newState) {
          // Toggle CSS zero-overhead suspension class on document root
          if (typeof document !== "undefined") {
            if (newState === "MINIMIZED_HIDDEN") {
              document.documentElement.classList.add("app-minimized");
            } else {
              document.documentElement.classList.remove("app-minimized");
            }
          }
          return newState;
        }
        return prev;
      });
    };

    // Initial evaluation
    updateState();

    // Standard DOM event listeners
    const handleVisibilityChange = () => {
      updateState();
    };
    const handleFocus = () => {
      updateState();
    };
    const handleBlur = () => {
      updateState();
    };
    const handleResize = () => {
      updateState();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Tauri native window listeners
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => {
        if (isCancelled) return;
        const currentWin = getCurrentWindow();

        currentWin
          .onFocusChanged(() => {
            updateState();
          })
          .then((unlisten) => {
            if (isCancelled) unlisten();
            else unlistenFocusRef.current = unlisten;
          })
          .catch(() => {});

        currentWin
          .onResized(() => {
            updateState();
          })
          .then((unlisten) => {
            if (isCancelled) unlisten();
            else unlistenResizeRef.current = unlisten;
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (unlistenFocusRef.current) {
        unlistenFocusRef.current();
        unlistenFocusRef.current = null;
      }
      if (unlistenResizeRef.current) {
        unlistenResizeRef.current();
        unlistenResizeRef.current = null;
      }
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("app-minimized");
      }
    };
  }, [evaluateState]);

  return {
    lifecycleState,
    isActive: lifecycleState === "VISIBLE_ACTIVE",
    isInactive: lifecycleState === "VISIBLE_INACTIVE",
    isMinimized: lifecycleState === "MINIMIZED_HIDDEN",
  };
}
