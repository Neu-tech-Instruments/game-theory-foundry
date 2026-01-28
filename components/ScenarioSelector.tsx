
import React from 'react';
import { ScenarioID } from '../types';
import { SCENARIOS } from '../constants';

interface Props {
  current: ScenarioID;
  onChange: (id: ScenarioID) => void;
}

export const ScenarioSelector: React.FC<Props> = ({ current, onChange }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {(Object.keys(SCENARIOS) as ScenarioID[]).map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`w-full px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border text-left flex items-center justify-between group ${current === id
            ? 'bg-[#e7f5ff] border-[#339af0] text-[#1971c2] shadow-sm'
            : 'bg-white border-[#dee2e6] text-[#495057] hover:bg-[#f8f9fa] hover:border-[#ced4da]'
            }`}
        >
          <span className="relative z-10">{SCENARIOS[id].title}</span>
          {current === id && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#1971c2]" />
          )}
        </button>
      ))}
    </div>
  );
};
