import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

interface ChatWindowProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isLoading?: boolean;
  typingUsers?: { user_id: number; username: string }[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, messagesEndRef, isLoading, typingUsers = [] }) => {
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { ws, currentRoom } = useChat();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const emojiList = [
    '😀','😁','😂','🤣','😊','😍','😘','😜','😎','🤔',
    '😅','😭','😡','🤯','😴','🤩','🥳','😇','😬','😐',
    '👍','👎','👏','🙏','🤝','💪','🫶','🔥','💯','✨',
    '❤️','🧡','💛','💚','💙','💜','🤍','🖤','💔','💎',
    '🎉','🎊','🎯','🎵','🎮','🚀','🌟','🌈','☀️','🌙',
    '🍕','🍔','🍟','🍿','☕','🥤','🍰','🍩','🍪','🍫',
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentRoom]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !ws || !ws.isConnected()) return;

    ws.sendMessage(messageInput.trim());
    ws.sendTyping(false);
    setMessageInput('');
    inputRef.current?.focus();
  };

  const handleTypingChange = (value: string) => {
    setMessageInput(value);
    if (!ws || !ws.isConnected()) return;
    const now = Date.now();
    if (value.trim().length === 0) {
      ws.sendTyping(false);
      return;
    }
    if (now - lastTypingSentRef.current > 300) {
      ws.sendTyping(true);
      lastTypingSentRef.current = now;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      ws.sendTyping(false);
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (ws?.isConnected()) {
        ws.sendTyping(false);
      }
    };
  }, [ws]);

  const appendEmoji = (emoji: string) => {
    setMessageInput((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] min-h-0">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              {isLoading ? (
                <>
                  <div className="text-sm font-medium">Loading messages...</div>
                  <div className="text-xs">Please wait</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">No messages yet</div>
                  <div className="text-xs">Start the conversation</div>
                </>
              )}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={`${message.id}-${message.timestamp}-${index}`}
              message={message}
              isOwn={message.user_id === user?.id}
              formatTime={formatTime}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-3 bg-[#f0f2f5]">
        {typingUsers.length > 0 && (
          <p className="text-xs text-slate-500 mb-2">
            {typingUsers.map((u) => u.username).join(', ')} typing...
          </p>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="text-lg text-slate-600 hover:scale-110 transition-transform"
              aria-label="Open emoji picker"
            >
              😊
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 w-64 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg p-3 grid grid-cols-8 gap-2 z-10">
                {emojiList.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => appendEmoji(emoji)}
                    className="text-lg hover:scale-110 transition-transform"
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={(e) => handleTypingChange(e.target.value)}
            onFocus={() => ws?.sendTyping(true)}
            onBlur={() => ws?.sendTyping(false)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-white focus:ring-2 focus:ring-[#25d366] focus:border-transparent outline-none"
            disabled={isLoading || !ws || !ws.isConnected()}
          />
          <button
            type="submit"
            disabled={isLoading || !messageInput.trim() || !ws || !ws.isConnected()}
            className="px-5 py-2.5 bg-[#25d366] text-white rounded-full hover:bg-[#20bd59] focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
        {(!ws || !ws.isConnected()) && (
          <p className="text-xs text-rose-500 mt-2">Not connected. Messages may not be sent.</p>
        )}
      </div>
    </div>
  );
};

