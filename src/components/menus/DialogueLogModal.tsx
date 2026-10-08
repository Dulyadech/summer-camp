import React from "react";
import { X, History } from "lucide-react";
import { useEngineState } from "@/state";

export const DialogueLogModal: React.FC = () => {
  const { isLogOpen, setLogOpen, history } = useEngineState();

  if (!isLogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <History className="w-4 h-4" />
            <span>Dialogue History & Backlog</span>
          </div>
          <button
            onClick={() => setLogOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-slate-500 py-12 text-sm">
              No dialogue recorded yet.
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="border-l-2 border-amber-500/50 pl-3.5 py-1">
                {entry.speakerName && (
                  <div className="text-xs font-semibold text-amber-300 mb-0.5">
                    {entry.speakerName}
                    {entry.speakerRole && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                        ({entry.speakerRole})
                      </span>
                    )}
                  </div>
                )}
                <div className="text-sm text-slate-200 leading-relaxed">
                  {entry.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
