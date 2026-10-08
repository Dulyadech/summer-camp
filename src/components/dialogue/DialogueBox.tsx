import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, FastForward, Play, History, Settings } from "lucide-react";
import type { DialogueChoice } from "@/types";
import { ChoiceList } from "./ChoiceList";
import { Nameplate } from "./Nameplate";

export interface DialogueBoxProps {
  speaker?: string;
  speakerRole?: string;
  avatarUrl?: string;
  text: string;
  choices?: DialogueChoice[];
  variant?: "glass" | "camp";
  isAuto?: boolean;
  isSkip?: boolean;
  onAdvance?: () => void;
  onSelectChoice?: (choice: DialogueChoice) => void;
  onToggleAuto?: () => void;
  onToggleSkip?: () => void;
  onOpenLog?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speaker = "Counselor Maya",
  speakerRole,
  avatarUrl,
  text,
  choices,
  variant = "camp",
  isAuto = false,
  isSkip = false,
  onAdvance,
  onSelectChoice,
  onToggleAuto,
  onToggleSkip,
  onOpenLog,
  onOpenSettings,
  className,
}) => {
  const isCampVariant = variant === "camp";

  return (
    <div className={cn("w-full max-w-4xl mx-auto flex flex-col gap-2 select-none", className)}>
      {/* Choice Branching Menu */}
      {choices && choices.length > 0 && onSelectChoice && (
        <ChoiceList choices={choices} onSelectChoice={onSelectChoice} />
      )}

      {/* Main Dialogue Box Container */}
      <div
        onClick={onAdvance}
        className={cn(
          "relative rounded-2xl p-5 md:p-6 transition-all duration-200 cursor-pointer",
          isCampVariant ? "dialogue-panel-camp" : "dialogue-panel"
        )}
      >
        {/* Header Bar: Speaker Nameplate + Controls */}
        <div className="flex items-center justify-between mb-3 -mt-1">
          {speaker && (
            <Nameplate
              speakerName={speaker}
              speakerRole={speakerRole}
              variant={variant}
            />
          )}

          {/* Quick Dialogue Action Controls */}
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {onToggleAuto && (
              <button
                type="button"
                onClick={onToggleAuto}
                title="Toggle Auto Read"
                className={cn(
                  "dialogue-ctrl-btn px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer",
                  isAuto && "active"
                )}
              >
                <Play className="w-3 h-3" />
                <span>AUTO</span>
              </button>
            )}

            {onToggleSkip && (
              <button
                type="button"
                onClick={onToggleSkip}
                title="Toggle Skip"
                className={cn(
                  "dialogue-ctrl-btn px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer",
                  isSkip && "active"
                )}
              >
                <FastForward className="w-3 h-3" />
                <span>SKIP</span>
              </button>
            )}

            {onOpenLog && (
              <button
                type="button"
                onClick={onOpenLog}
                title="View Dialogue History"
                className="dialogue-ctrl-btn px-2 py-1 rounded-lg text-xs cursor-pointer text-slate-300 hover:text-white"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Settings"
                className="dialogue-ctrl-btn px-2 py-1 rounded-lg text-xs cursor-pointer text-slate-300 hover:text-white"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area: Avatar + Dialogue Text */}
        <div className="flex items-start gap-4">
          {avatarUrl && (
            <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border border-white/20 shadow-md bg-slate-900/60">
              <img
                src={avatarUrl}
                alt={speaker}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-h-[4rem]">
            <p className="text-slate-100 text-sm md:text-base leading-relaxed tracking-wide select-text">
              {text}
            </p>
          </div>
        </div>

        {/* Next / Advance Indicator Arrow */}
        <div className="absolute right-4 bottom-3 flex items-center gap-1 text-slate-400 text-xs">
          <span className="hidden md:inline text-[10px] opacity-70">CLICK TO CONTINUE</span>
          <div className="animate-dialogue-prompt text-sky-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
