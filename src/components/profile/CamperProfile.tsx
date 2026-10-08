import React from "react";
import { X, User, Backpack, Award } from "lucide-react";
import { useEngineState, useGameState } from "@/state";

export const CamperProfile: React.FC = () => {
  const { isProfileOpen, setProfileOpen } = useEngineState();
  const { stats, inventory, flags } = useGameState();

  if (!isProfileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md flex flex-col rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <User className="w-4 h-4" />
            <span>Camper Profile & Inventory</span>
          </div>
          <button
            onClick={() => setProfileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Attributes */}
          <div>
            <div className="flex items-center gap-1.5 font-medium text-amber-300 text-xs uppercase tracking-wider mb-2.5">
              <Award className="w-3.5 h-3.5" />
              <span>Attributes & Skills</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats).map(([stat, val]) => (
                <div key={stat} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400 capitalize">{stat}</span>
                  <span className="text-sm font-semibold text-amber-400">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Backpack Inventory */}
          <div>
            <div className="flex items-center gap-1.5 font-medium text-sky-300 text-xs uppercase tracking-wider mb-2.5">
              <Backpack className="w-3.5 h-3.5" />
              <span>Backpack ({inventory.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {inventory.length === 0 ? (
                <span className="text-xs text-slate-500">Backpack is empty.</span>
              ) : (
                inventory.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-lg bg-sky-950/60 border border-sky-400/30 text-sky-200 text-xs font-medium"
                  >
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Unlocked Choices / Flags */}
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">
              Story Flags Recorded
            </div>
            <div className="text-xs font-mono text-slate-400 bg-black/30 p-2.5 rounded-xl max-h-24 overflow-y-auto">
              {Object.keys(flags).length === 0 ? (
                <span>No flags recorded yet.</span>
              ) : (
                Object.entries(flags).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}:</span>
                    <span className={v ? "text-emerald-400" : "text-rose-400"}>{String(v)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
