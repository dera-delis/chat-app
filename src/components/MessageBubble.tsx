import React, { useEffect, useState } from 'react';
import { Message } from '../types/chat';
import { useChat } from '../context/ChatContext';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  formatTime: (timestamp: string) => string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, formatTime }) => {
  const { ws } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  useEffect(() => {
    if (!isEditing) {
      setDraft(message.content);
    }
  }, [message.content, isEditing]);

  const handleSave = () => {
    const next = draft.trim();
    if (!next || !ws || !ws.isConnected()) return;
    ws.editMessage(message.id, next);
    setIsEditing(false);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-[#dcf8c6] text-slate-900'
            : 'bg-white text-slate-800'
        }`}
      >
        {!isOwn && (
          <div className="text-[11px] font-semibold mb-1 text-slate-500">
            {message.username}
          </div>
        )}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className={`w-full text-sm rounded-xl border px-3 py-2 outline-none ${
                isOwn ? 'border-indigo-400 bg-indigo-500/10 text-white' : 'border-slate-200 bg-white'
              }`}
            />
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={handleSave}
                className={isOwn ? 'text-white underline' : 'text-indigo-600 underline'}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setDraft(message.content);
                }}
                className={isOwn ? 'text-indigo-100/90' : 'text-slate-500'}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
        )}
        <div className={`text-[11px] mt-2 flex items-center gap-2 ${
          isOwn ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.edited && <span>• Edited</span>}
          {isOwn && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={isOwn ? 'text-slate-500 underline' : 'text-[#075e54] underline'}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

