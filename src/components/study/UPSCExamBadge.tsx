import React from 'react';
import { GraduationCap } from 'lucide-react';
import type { UPSCAnnotation } from '../../data/upscData';

interface UPSCExamBadgeProps {
  annotation: UPSCAnnotation;
  onClick: () => void;
}

export const UPSCExamBadge: React.FC<UPSCExamBadgeProps> = ({ annotation, onClick }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300/80 cursor-pointer transition-all shadow-2xs hover:shadow-xs active:scale-95 group select-none"
      title="सप्रसंग व्याख्या व परीक्षा नोट्स देखें"
    >
      <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
        <GraduationCap className="w-2.5 h-2.5" />
      </div>
      <span className="text-[11px] font-bold">
        {annotation.title}
      </span>
      <span className="text-[10px] font-semibold text-amber-800/80 group-hover:text-amber-950 flex items-center gap-0.5">
        <span>व्याख्या देखें</span>
        <span>→</span>
      </span>
    </div>
  );
};
