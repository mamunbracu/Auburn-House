
import React from 'react';
import { MEMBERS } from '../constants';
import { MemberName } from '../types';

interface MemberStripProps {
  onMemberClick?: (name: MemberName) => void;
}

const MemberStrip: React.FC<MemberStripProps> = ({ onMemberClick }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pb-2 sm:pb-4 px-1">
      {MEMBERS.map((member) => (
        <button
          key={member.id}
          onClick={() => onMemberClick?.(member.name)}
          className="flex flex-col items-center justify-center bg-white p-2 sm:p-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md active:scale-95 transition-all w-[calc(25%-6px)] sm:w-auto sm:min-w-[90px]"
        >
          <div className="relative">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full mb-1.5 sm:mb-2 bg-indigo-50 object-cover ring-2 ring-indigo-50 ring-offset-2"
            />
            <div className="absolute bottom-0.5 sm:bottom-1 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-700 truncate w-full text-center">{member.name}</span>
        </button>
      ))}
    </div>
  );
};

export default MemberStrip;
