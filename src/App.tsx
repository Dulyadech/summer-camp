import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TopHud, DialogueBox, CampScene, DialogueLogModal, SettingsModal, CamperProfile } from "@/components";
import { useGameState, useEngineState, useSettingsStore } from "@/state";
import { EPISODE_1, getCharacter } from "@/narrative";
import { advanceNode, getAvailableChoices } from "@/engine";
import type { DialogueChoice } from "@/types";
import { Sparkles, Send, Save, Download } from "lucide-react";

export default function App() {
  const {
    currentSceneId,
    currentNodeId,
    flags,
    stats,
    setScenePosition,
    setFlag,
    modifyStat,
  } = useGameState();

  const {
    isAuto,
    isSkip,
    toggleAuto,
    toggleSkip,
    setLogOpen,
    setSettingsOpen,
    addHistoryEntry,
  } = useEngineState();

  const { themeVariant } = useSettingsStore();

  const [customName, setCustomName] = useState("");
  const [greetResponse, setGreetResponse] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Retrieve current scene and node from declarative narrative tree
  const activeScene = EPISODE_1.scenes[currentSceneId] || EPISODE_1.scenes.scene_campfire;
  const activeNode = activeScene.nodes[currentNodeId] || activeScene.nodes.node_1;
  const speaker = getCharacter(activeNode.speakerId);

  // Available choices matching conditions
  const availableChoices = getAvailableChoices(activeNode, flags, stats);

  const handleAdvance = () => {
    // Cannot advance while choices are waiting
    if (availableChoices.length > 0) return;

    // Record into dialogue history
    addHistoryEntry({
      id: `${activeNode.id}_${Date.now()}`,
      speakerName: speaker?.name,
      speakerRole: speaker?.role,
      text: activeNode.text,
      timestamp: Date.now(),
    });

    const nextNode = advanceNode(activeScene, activeNode);
    if (nextNode) {
      if (nextNode.actions?.setFlags) {
        Object.entries(nextNode.actions.setFlags).forEach(([k, v]) => setFlag(k, v));
      }
      if (nextNode.actions?.modifyStats) {
        Object.entries(nextNode.actions.modifyStats).forEach(([k, v]) => modifyStat(k, v));
      }
      setScenePosition("ep1", currentSceneId, nextNode.id);
    } else {
      // Loop or restart to startNode
      setScenePosition("ep1", currentSceneId, activeScene.startNodeId);
    }
  };

  const handleSelectChoice = (choice: DialogueChoice) => {
    // Record into dialogue history
    addHistoryEntry({
      id: `${choice.id}_${Date.now()}`,
      speakerName: "Player Choice",
      text: choice.text,
      timestamp: Date.now(),
    });

    if (choice.onSelectAction?.setFlags) {
      Object.entries(choice.onSelectAction.setFlags).forEach(([k, v]) => setFlag(k, v));
    }
    if (choice.onSelectAction?.modifyStats) {
      Object.entries(choice.onSelectAction.modifyStats).forEach(([k, v]) => modifyStat(k, v));
    }

    const nextNode = advanceNode(activeScene, activeNode, choice.id);
    if (nextNode) {
      setScenePosition("ep1", currentSceneId, nextNode.id);
    }
  };

  // Rust native File I/O: Save game
  const handleSaveGame = async () => {
    const saveData = {
      timestamp: Date.now(),
      currentSceneId,
      currentNodeId,
      flags,
      stats,
    };
    try {
      const res = await invoke<string>("save_game_file", {
        filename: "save_slot_1.json",
        content: JSON.stringify(saveData, null, 2),
      });
      setSaveStatus(res);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus(`Save Error: ${String(err)}`);
    }
  };

  // Rust native File I/O: Load game
  const handleLoadGame = async () => {
    try {
      const content = await invoke<string>("load_game_file", {
        filename: "save_slot_1.json",
      });
      const data = JSON.parse(content);
      if (data.currentSceneId && data.currentNodeId) {
        setScenePosition("ep1", data.currentSceneId, data.currentNodeId);
        setSaveStatus("Game loaded successfully!");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      setSaveStatus(`Load Error: ${String(err)}`);
    }
  };

  const handleGreet = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customName.trim()) return;
    try {
      const res = await invoke<string>("greet", { name: customName.trim() });
      setGreetResponse(res);
    } catch (err) {
      console.error("Failed to invoke greet:", err);
      setGreetResponse(`Hello, ${customName}! (Local fallback)`);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 selection:bg-amber-500/30">
      {/* Background Ambience & PixiJS WebGPU Canvas */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-600/20 via-orange-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-24 left-1/4 w-[500px] h-[300px] bg-emerald-950/40 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* PixiJS v8 Game Stage Canvas */}
      <div className="absolute inset-0 z-0">
        <CampScene />
      </div>

      {/* Top Application HUD */}
      <TopHud />

      {/* Main Scene / Stage Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
        {/* Camper Registration and Native File I/O Card */}
        <div className="w-full max-w-md p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-3.5 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Camper Station & Native File I/O</span>
          </div>

          <form onSubmit={handleGreet} className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter camper name..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-white/15 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-amber-50 font-medium text-sm flex items-center gap-1.5 shadow-md shadow-amber-900/40 transition-all cursor-pointer"
            >
              <span>Greet</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {greetResponse && (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in">
              {greetResponse}
            </div>
          )}

          {/* Native Rust File I/O Quick Actions */}
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-white/10">
            <button
              onClick={handleSaveGame}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Native Save</span>
            </button>
            <button
              onClick={handleLoadGame}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Native Load</span>
            </button>
          </div>

          {saveStatus && (
            <div className="text-[11px] text-amber-300 font-mono animate-in fade-in">
              {saveStatus}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Visual Novel Dialogue Box */}
      <footer className="relative z-20 w-full px-4 pb-6 pt-2">
        <DialogueBox
          speaker={speaker?.name}
          speakerRole={speaker?.role}
          text={activeNode.text}
          choices={availableChoices}
          variant={themeVariant}
          isAuto={isAuto}
          isSkip={isSkip}
          onAdvance={handleAdvance}
          onSelectChoice={handleSelectChoice}
          onToggleAuto={toggleAuto}
          onToggleSkip={toggleSkip}
          onOpenLog={() => setLogOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </footer>

      {/* Modals */}
      <DialogueLogModal />
      <SettingsModal />
      <CamperProfile />
    </div>
  );
}
