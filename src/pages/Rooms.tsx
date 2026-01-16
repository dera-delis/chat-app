import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { roomsApi } from '../api/rooms';
import { Room } from '../types/chat';
import { Sidebar } from '../components/Sidebar';

export const Rooms: React.FC = () => {
  const { user, logout } = useAuth();
  const { rooms, setRooms, setCurrentRoom } = useChat();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const getErrorMessage = (err: any, fallback: string) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0]?.msg || fallback;
    }
    return err?.message || fallback;
  };

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [memberRooms, allPublicRooms] = await Promise.all([
        roomsApi.getRooms(),
        roomsApi.getPublicRooms(),
      ]);
      setRooms(memberRooms);
      setPublicRooms(allPublicRooms);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load rooms'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      setIsCreating(true);
      const newRoom = await roomsApi.createRoom({
        name: newRoomName,
        description: newRoomDescription || undefined,
        is_private: newRoomPrivate,
      });
      setRooms([...rooms, newRoom]);
      if (!newRoom.is_private) {
        setPublicRooms((prev) => (prev.some((room) => room.id === newRoom.id) ? prev : [...prev, newRoom]));
      }
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomPrivate(false);
      setShowCreateModal(false);
      navigate(`/rooms/${newRoom.id}`);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to create room'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    try {
      setError('');
      await roomsApi.joinRoom(roomId);
      await loadRooms(); // Refresh rooms list
      navigate(`/rooms/${roomId}`);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to join room'));
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    const confirmed = window.confirm('Delete this room? This cannot be undone.');
    if (!confirmed) return;
    try {
      setError('');
      await roomsApi.deleteRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setPublicRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to delete room'));
    }
  };

  const handleSelectRoom = (room: Room) => {
    setCurrentRoom(room);
    navigate(`/rooms/${room.id}`);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Chat Rooms</h1>
              <p className="text-sm text-slate-500">Welcome back, {user?.username}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
              >
                New Room
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-slate-500">Loading rooms...</p>
            </div>
          ) : publicRooms.length === 0 && rooms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">No rooms yet. Create your first room!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
              >
                Create Room
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Your Rooms</h2>
                  <span className="text-xs text-slate-400">{rooms.length}</span>
                </div>
                {rooms.length === 0 ? (
                  <p className="text-sm text-slate-500">You are not in any rooms yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {rooms.map((room) => {
                      const isCreator = user?.id === room.created_by;
                      return (
                        <div
                          key={room.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleSelectRoom(room)}
                        >
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">{room.name}</h3>
                          {room.description && (
                            <p className="text-sm text-slate-600 mb-4">{room.description}</p>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${
                              !room.is_private ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {!room.is_private ? 'Public' : 'Private'}
                            </span>
                            {isCreator && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(room.id);
                                }}
                                className="text-sm text-rose-600 hover:text-rose-700"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Public Rooms</h2>
                  <span className="text-xs text-slate-400">{publicRooms.length}</span>
                </div>
                {publicRooms.length === 0 ? (
                  <p className="text-sm text-slate-500">No public rooms available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {publicRooms.map((room) => {
                      const isMember = rooms.some((memberRoom) => memberRoom.id === room.id);
                      return (
                        <div
                          key={room.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => (isMember ? handleSelectRoom(room) : handleJoinRoom(room.id))}
                        >
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">{room.name}</h3>
                          {room.description && (
                            <p className="text-sm text-slate-600 mb-4">{room.description}</p>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                              Public
                            </span>
                            {isMember ? (
                              <span className="text-xs text-slate-500">Joined</span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinRoom(room.id);
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800"
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Create New Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="My Chat Room"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="What's this room about?"
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  id="private-room"
                  type="checkbox"
                  checked={newRoomPrivate}
                  onChange={(e) => setNewRoomPrivate(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                />
                <label htmlFor="private-room" className="text-sm text-slate-700">
                  Make this room private
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-full hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoomName('');
                    setNewRoomDescription('');
                    setNewRoomPrivate(false);
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
    </div>
  );
};

