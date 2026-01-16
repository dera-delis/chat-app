import React from 'react';
import { PresenceUser } from '../types/chat';

interface PresenceListProps {
  presence: PresenceUser[];
  currentUserId?: number;
  isLoading?: boolean;
}

export const PresenceList: React.FC<PresenceListProps> = ({ presence, currentUserId, isLoading }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Online</h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {presence.length}
        </span>
      </div>
      <div className="space-y-2">
        {presence.length === 0 ? (
          <p className="text-xs text-slate-500">
            {isLoading ? 'Loading presence...' : 'No users online'}
          </p>
        ) : (
          presence.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
            >
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-slate-700">
                {user.username}
                {user.user_id === currentUserId && ' (You)'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

