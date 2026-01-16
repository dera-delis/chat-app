import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { roomsApi } from '../api/rooms';
import { messagesApi } from '../api/messages';
import { presenceApi } from '../api/presence';
import { PresenceUser } from '../types/chat';
import { ChatWindow } from '../components/ChatWindow';
import { Sidebar } from '../components/Sidebar';
import { PresenceList } from '../components/PresenceList';

export const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const { currentRoom, setCurrentRoom, messages, setMessages, isConnected, typingUsers } = useChat();
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteValue, setInviteValue] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState<{ id: number; username?: string }[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    // Clear room state immediately when roomId changes
    setCurrentRoom(null);
    setMessages([]);
    setError('');
    
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    if (roomId) {
      loadRoom();
    } else {
      // No roomId, ensure room is cleared
      setCurrentRoom(null);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, authLoading, isAuthenticated]); // Only depend on roomId/auth state (stable setters)

  useEffect(() => {
    if (currentRoom) {
      const interval = setInterval(() => loadPresenceForRoom(currentRoom.id), 10000); // Refresh presence every 10 seconds
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRoom = async () => {
    if (!roomId) return;
    
    try {
      setIsLoading(true);
      setError(''); // Clear any previous errors
      setCurrentRoom(null); // Clear current room while loading
      const roomIdNum = parseInt(roomId, 10);
      if (isNaN(roomIdNum)) {
        throw new Error('Invalid room ID');
      }
      const room = await roomsApi.getRoom(roomIdNum);
      // Load messages/presence before connecting WebSocket to avoid contention
      await loadMessagesForRoom(room.id);
      await loadPresenceForRoom(room.id);
      // Only set room if we successfully loaded data
      setCurrentRoom(room);
    } catch (err: any) {
      let errorMessage = 'Failed to load room';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      // Ensure room is cleared on error
      setCurrentRoom(null);
      
      if (err.response?.status === 404) {
        setTimeout(() => {
          navigate('/rooms', { replace: true });
        }, 0);
      } else if (err.response?.status === 403) {
        setError('You are not a member of this room. Please join the room first.');
        setTimeout(() => {
          navigate('/rooms', { replace: true });
        }, 2000); // Give user time to see the error message
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessagesForRoom = async (roomId: number) => {
    try {
      const fetchedMessages = await messagesApi.getMessages(roomId);
      setMessages(fetchedMessages);
    } catch {
      // Errors handled in UI via primary room load
    }
  };

  const loadPresenceForRoom = async (roomId: number) => {
    try {
      const users = await presenceApi.getPresence(roomId);
      setPresence(users);
    } catch {
      // Presence updates are best-effort
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    
    try {
      await roomsApi.leaveRoom(currentRoom.id);
      navigate('/rooms');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to leave room');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !inviteValue.trim()) return;
    try {
      setIsInviting(true);
      setError('');
      const value = inviteValue.trim();
      const payload = value.includes('@') ? { email: value } : { username: value };
      await roomsApi.inviteMember(currentRoom.id, payload);
      setInviteValue('');
      setShowInviteModal(false);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateInviteLink = async () => {
    if (!currentRoom) return;
    try {
      setIsCreatingInvite(true);
      setError('');
      const invite = await roomsApi.createInviteLink(currentRoom.id);
      const url = `${window.location.origin}/invite/${invite.token}`;
      setInviteLink(url);
      setShowInviteLinkModal(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create invite link');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleLoadRequests = async () => {
    if (!currentRoom) return;
    try {
      setIsLoadingRequests(true);
      const requests = await roomsApi.getJoinRequests(currentRoom.id);
      setJoinRequests(requests.map((req) => ({ id: req.id, username: req.username })));
      setPendingRequestCount(requests.length);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to load requests');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!currentRoom) return;
    await roomsApi.approveJoinRequest(currentRoom.id, requestId);
    setJoinRequests((prev) => prev.filter((req) => req.id !== requestId));
    setPendingRequestCount((prev) => Math.max(0, prev - 1));
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!currentRoom) return;
    await roomsApi.rejectJoinRequest(currentRoom.id, requestId);
    setJoinRequests((prev) => prev.filter((req) => req.id !== requestId));
    setPendingRequestCount((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (!currentRoom?.is_private || user?.id !== currentRoom.created_by) {
      setPendingRequestCount(0);
      return;
    }
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const requests = await roomsApi.getJoinRequests(currentRoom.id);
        if (isMounted) {
          setPendingRequestCount(requests.length);
        }
      } catch {
        // Best-effort indicator
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentRoom?.id, currentRoom?.is_private, currentRoom?.created_by, user?.id]);

  if (error && !currentRoom) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-rose-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/rooms')}
            className="px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#efeae2]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-[#075e54] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">
                {currentRoom?.name || 'Loading room...'}
              </h1>
              {currentRoom?.description && (
                <p className="text-sm text-white/80">{currentRoom.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-300' : 'bg-rose-300'}`}></span>
                <span className="text-xs text-white/70">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentRoom?.is_private && user?.id === currentRoom?.created_by && (
                <>
                  <button
                    onClick={handleCreateInviteLink}
                    className="px-4 py-2 text-white/90 hover:text-white transition-colors"
                    disabled={isCreatingInvite}
                  >
                    Invite Link
                  </button>
                  <button
                    onClick={() => {
                      setShowRequestsModal(true);
                      handleLoadRequests();
                    }}
                    className="px-4 py-2 text-white/90 hover:text-white transition-colors"
                  >
                    Requests
                    {pendingRequestCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center text-[10px] font-semibold bg-rose-500 text-white rounded-full h-5 min-w-[20px] px-1">
                        {pendingRequestCount}
                      </span>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 text-white/90 hover:text-white transition-colors"
              >
                Invite
              </button>
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 text-white/90 hover:text-white transition-colors"
              >
                Leave Room
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-white/90 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <ChatWindow messages={messages} messagesEndRef={messagesEndRef} isLoading={isLoading} typingUsers={typingUsers} />
          </div>
          <div className="w-72 p-4 border-l border-slate-200 bg-white min-h-0">
            <PresenceList presence={presence} currentUserId={user?.id} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-2 text-slate-900">Invite to room</h2>
            <p className="text-sm text-slate-500 mb-4">Enter a username or email.</p>
            <form onSubmit={handleInvite}>
              <input
                type="text"
                value={inviteValue}
                onChange={(e) => setInviteValue(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="username or email"
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-full hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isInviting ? 'Inviting...' : 'Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteValue('');
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-full hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteLinkModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-2 text-slate-900">Share invite link</h2>
            <p className="text-sm text-slate-500 mb-4">Anyone with this link can request access.</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowInviteLinkModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-full hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestsModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-2 text-slate-900">Join requests</h2>
            {isLoadingRequests ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : joinRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No pending requests.</p>
            ) : (
              <div className="space-y-3 mt-4">
                {joinRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{req.username || `User ${req.id}`}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-full hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowRequestsModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-full hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

