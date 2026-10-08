import React from "react";
import type { DialogueChoice } from "@/types";
import { cn } from "@/lib/utils";

export interface ChoiceListProps {
  choices: DialogueChoice[];
  onSelectChoice: (choice: DialogueChoice) => void;
  className?: string;
}

export const ChoiceList: React.FC<ChoiceListProps> = ({
  choices,
  onSelectChoice,
  className,
}) => {
  if (!choices || choices.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 mb-2 px-4 animate-in fade-in slide-in-from-bottom-2 duration-200",
        className
      )}
    >
      {choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onSelectChoice(choice)}
          className="dialogue-choice-btn w-full px-5 py-3 rounded-xl text-left text-sm md:text-base font-medium text-slate-100 hover:text-white flex items-center justify-between group cursor-pointer"
        >
          <span>{choice.text}</span>
          <span className="opacity-0 group-hover:opacity-100 text-sky-400 transition-opacity">
            ➔
          </span>
        </button>
      ))}
    </div>
  );
};
