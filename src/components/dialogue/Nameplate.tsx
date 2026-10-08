import React from "react";
import { cn } from "@/lib/utils";

export interface NameplateProps {
  speakerName: string;
  speakerRole?: string;
  variant?: "camp" | "glass";
  className?: string;
}

export const Nameplate: React.FC<NameplateProps> = ({
  speakerName,
  speakerRole,
  variant = "camp",
  className,
}) => {
  const isCampVariant = variant === "camp";

  return (
    <div
      className={cn(
        "px-4 py-1 rounded-full text-xs md:text-sm font-semibold tracking-wide shadow-sm flex items-center gap-1.5",
        isCampVariant
          ? "speaker-nameplate text-amber-50"
          : "bg-sky-600/80 border border-sky-400/30 text-sky-50 shadow-sky-900/30",
        className
      )}
    >
      <span>{speakerName}</span>
      {speakerRole && (
        <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider ml-1">
          ({speakerRole})
        </span>
      )}
    </div>
  );
};
