
import React from 'react';
import { MEMBERS } from '../constants';
import { MemberName } from '../types';

interface MemberStripProps {
  onMemberClick?: (name: MemberName) => void;
}

const MemberStrip: React.FC<MemberStripProps> = ({ onMemberClick }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 px-1 no-scrollbar snap-x snap-mandatory">
      {MEMBERS.map((member) => (
        <button
          key={member.id}
          onClick={() => onMemberClick?.(member.name)}
          className="flex-shrink-0 flex flex-col items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md active:scale-95 transition-all min-w-[90px] snap-center"
        >
          <div className="relative">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-14 h-14 rounded-full mb-2 bg-indigo-50 object-cover ring-2 ring-indigo-50 ring-offset-2"
            />
            <div className="absolute bottom-1 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <span className="text-xs font-bold text-slate-700 truncate w-full text-center">{member.name}</span>
        </button>
      ))}
    </div>
  );
};

export default MemberStrip;
