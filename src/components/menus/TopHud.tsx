import React from "react";
import { Flame, Compass, Sun, Moon, User, Settings } from "lucide-react";
import { useGameState, useEngineState, useSettingsStore } from "@/state";

export const TopHud: React.FC = () => {
  const { stats } = useGameState();
  const { setSettingsOpen, setProfileOpen } = useEngineState();
  const { themeVariant, setThemeVariant } = useSettingsStore();

  return (
    <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
      {/* Camp Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-950/50 border border-amber-300/30">
          <Flame className="w-5 h-5 text-amber-100 animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-amber-100 uppercase">
            Summer Camp
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Day 1 • 19:45 PM • Campfire Grounds
          </p>
        </div>
      </div>

      {/* Stats & Controls */}
      <div className="flex items-center gap-3">
        {/* Stamina Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Stamina:</span>
          <span className="font-semibold text-emerald-400">
            {stats.stamina ?? 100} / 100
          </span>
        </div>

        {/* Profile Button */}
        <button
          onClick={() => setProfileOpen(true)}
          title="Open Camper Profile"
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Profile</span>
        </button>

        {/* Theme Variant Toggle */}
        <button
          onClick={() => setThemeVariant(themeVariant === "camp" ? "glass" : "camp")}
          title="Toggle Dialogue Theme Variant"
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {themeVariant === "camp" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Rustic Camp</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Liquid Glass</span>
            </>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="Open Settings"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
