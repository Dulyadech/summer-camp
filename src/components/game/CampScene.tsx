import React, { useEffect, useRef } from "react";
import { Container, Graphics, type Ticker } from "pixi.js";
import { usePixiApp } from "@/hooks/usePixiApp";
import { Cpu, Zap, Moon, BatteryMedium } from "lucide-react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  color: number;
}

export interface CampSceneProps {
  className?: string;
}

export const CampScene: React.FC<CampSceneProps> = ({ className }) => {
  const {
    containerRef,
    app,
    isReady,
    isPaused,
    lifecycleState,
    rendererType,
    logCapabilities,
    resumeRendering,
  } = usePixiApp({
    backgroundAlpha: 0,
    antialias: true,
  });

  const tickerRef = useRef<((ticker: Ticker) => void) | null>(null);

  useEffect(() => {
    if (!app || !isReady) return;

    const width = app.screen.width || 800;
    const height = app.screen.height || 600;

    const rootContainer = new Container();
    app.stage.addChild(rootContainer);

    // 1. Static Ambient Campfire Glow Layer (drawn once, zero per-frame redraw cost)
    const staticGlowGraphics = new Graphics();
    rootContainer.addChild(staticGlowGraphics);

    const campfireX = width / 2;
    const campfireY = height * 0.85;

    staticGlowGraphics
      .circle(campfireX, campfireY, 140)
      .fill({ color: 0xf97316, alpha: 0.05 })
      .circle(campfireX, campfireY, 70)
      .fill({ color: 0xfbbf24, alpha: 0.1 });

    // 2. Static Starry Sky Layer (drawn once, zero per-frame redraw cost)
    const staticStarsGraphics = new Graphics();
    rootContainer.addChild(staticStarsGraphics);

    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * (height * 0.7);
      const sr = Math.random() * 1.5 + 0.5;
      const salpha = Math.random() * 0.7 + 0.2;
      staticStarsGraphics.circle(sx, sy, sr).fill({ color: 0xffffff, alpha: salpha });
    }

    // 3. Dynamic Embers Layer (lightweight particle simulation)
    const embersGraphics = new Graphics();
    rootContainer.addChild(embersGraphics);

    const emberColors = [0xffedd5, 0xfed7aa, 0xfba94b, 0xf97316, 0xef4444];
    const particles: Particle[] = [];

    const spawnParticle = (sourceX: number, sourceY: number): Particle => {
      const maxLife = Math.random() * 120 + 60;
      return {
        x: sourceX + (Math.random() - 0.5) * 70,
        y: sourceY + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -(Math.random() * 1.6 + 0.6),
        radius: Math.random() * 2.2 + 1.0,
        alpha: 0,
        maxAlpha: Math.random() * 0.8 + 0.2,
        life: 0,
        maxLife,
        color: emberColors[Math.floor(Math.random() * emberColors.length)],
      };
    };

    // Pre-populate 25 lightweight ember particles
    for (let i = 0; i < 25; i++) {
      const p = spawnParticle(campfireX, campfireY);
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    // Main Animation Loop
    const onTick = () => {
      const currentCampX = app.screen.width / 2;
      const currentCampY = app.screen.height * 0.85;

      embersGraphics.clear();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx + Math.sin(p.life * 0.05) * 0.3;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        if (progress < 0.2) {
          p.alpha = (progress / 0.2) * p.maxAlpha;
        } else {
          p.alpha = (1 - (progress - 0.2) / 0.8) * p.maxAlpha;
        }

        if (p.life >= p.maxLife || p.y < -20) {
          particles[i] = spawnParticle(currentCampX, currentCampY);
        } else {
          embersGraphics.circle(p.x, p.y, p.radius).fill({ color: p.color, alpha: p.alpha });
        }
      }
    };

    tickerRef.current = onTick;
    app.ticker.add(onTick);

    return () => {
      if (tickerRef.current) {
        app.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      rootContainer.destroy({ children: true });
    };
  }, [app, isReady]);

  const isWebGPU = rendererType === "WebGPU";

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ""}`}>
      {/* Pixi Canvas Mounting Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Live Renderer & 3-Tier Lifecycle Power Management Indicator Badge */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (isPaused) {
              resumeRendering();
            } else {
              logCapabilities();
            }
          }}
          title={
            lifecycleState === "MINIMIZED_HIDDEN" || isPaused
              ? "Rendering suspended (Zero GPU / Compositor detached: 0% GPU). Click to resume manually."
              : lifecycleState === "VISIBLE_INACTIVE"
              ? "Window unfocused: Throttled to 30 FPS power-save mode. Click to print capability report."
              : isWebGPU
              ? "Window focused: Full 60+ FPS hardware WebGPU rendering. Click to print capability report."
              : "Window focused: Full 60+ FPS WebGL fallback rendering. Click to print capability report."
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide backdrop-blur-md border shadow-lg transition-all cursor-pointer ${
            lifecycleState === "MINIMIZED_HIDDEN" || isPaused
              ? "bg-slate-900/80 hover:bg-slate-800 border-slate-600/50 text-slate-400"
              : lifecycleState === "VISIBLE_INACTIVE"
              ? "bg-sky-950/70 hover:bg-sky-900/80 border-sky-500/40 text-sky-300 shadow-sky-950/40"
              : isWebGPU
              ? "bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40"
              : "bg-amber-950/70 hover:bg-amber-900/80 border-amber-500/40 text-amber-300 shadow-amber-950/40"
          }`}
        >
          {lifecycleState === "MINIMIZED_HIDDEN" || isPaused ? (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-400" />
              <span>Sleeping (0% GPU)</span>
            </>
          ) : lifecycleState === "VISIBLE_INACTIVE" ? (
            <>
              <BatteryMedium className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold">{rendererType}</span>
              <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-sky-500/20 text-sky-200">
                30 FPS Eco
              </span>
            </>
          ) : (
            <>
              {isWebGPU ? (
                <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="font-semibold">{rendererType}</span>
              <span className="text-[9px] opacity-75 uppercase px-1 py-0.5 rounded bg-white/10">
                {isWebGPU ? "Primary (60 FPS)" : "Fallback (60 FPS)"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
