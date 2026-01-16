import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { rooms } = useChat();
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="w-72 bg-white text-slate-800 border-r border-slate-200 flex flex-col">
      <div className="p-5 border-b border-slate-200 bg-[#075e54] text-white">
        <Link to="/rooms" className="text-xl font-semibold tracking-tight">
          PulseChat
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300"></span>
          <p className="text-xs text-white/80">@{user?.username}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Link
            to="/rooms"
            className={`block px-4 py-2 rounded-xl mb-3 transition-colors ${
              location.pathname === '/rooms'
                ? 'bg-[#dcf8c6] text-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Rooms
          </Link>
        </div>
        
        <div className="px-4 pb-2">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Your Rooms
          </h3>
        </div>
        
        <div className="px-3 space-y-1">
          {rooms.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">No rooms yet</p>
          ) : (
            rooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className={`block px-3 py-2 rounded-xl transition-colors ${
                  location.pathname === `/rooms/${room.id}`
                    ? 'bg-[#dcf8c6] text-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{room.name}</span>
                  {!room.is_private && (
                    <span className="text-[10px] text-slate-500 border border-slate-300 rounded-full px-2 py-0.5">
                      public
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

