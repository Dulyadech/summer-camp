import React from "react";
import { X, Volume2, Sliders } from "lucide-react";
import { useEngineState, useSettingsStore } from "@/state";

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen } = useEngineState();
  const {
    masterVolume,
    bgmVolume,
    sfxVolume,
    voiceVolume,
    textSpeed,
    autoSpeed,
    setMasterVolume,
    setBgmVolume,
    setSfxVolume,
    setVoiceVolume,
    setTextSpeed,
    setAutoSpeed,
  } = useSettingsStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg flex flex-col rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Sliders className="w-4 h-4" />
            <span>Game Settings</span>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Audio Section */}
          <div>
            <div className="flex items-center gap-2 font-medium text-amber-300 text-xs uppercase tracking-wider mb-3">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Audio Configuration</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Master Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-40 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-8 text-right">{masterVolume}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">BGM Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(Number(e.target.value))}
                  className="w-40 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-8 text-right">{bgmVolume}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">SFX Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(Number(e.target.value))}
                  className="w-40 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-8 text-right">{sfxVolume}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Voice Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(Number(e.target.value))}
                  className="w-40 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-8 text-right">{voiceVolume}%</span>
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Gameplay Section */}
          <div>
            <div className="font-medium text-amber-300 text-xs uppercase tracking-wider mb-3">
              Gameplay & Text
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Text Speed</span>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={textSpeed}
                  onChange={(e) => setTextSpeed(Number(e.target.value))}
                  className="w-40 accent-sky-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-8 text-right">{textSpeed}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Auto Advance Delay</span>
                <input
                  type="range"
                  min="1000"
                  max="5000"
                  step="500"
                  value={autoSpeed}
                  onChange={(e) => setAutoSpeed(Number(e.target.value))}
                  className="w-40 accent-sky-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-8 text-right">{autoSpeed / 1000}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
