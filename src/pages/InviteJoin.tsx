import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomsApi } from '../api/rooms';

export const InviteJoin: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    setStatus('loading');
    roomsApi.requestJoinByInvite(token)
      .then(() => {
        setStatus('success');
        setMessage('Join request sent. Waiting for approval.');
      })
      .catch((err) => {
        const detail = err.response?.data?.detail;
        setStatus('error');
        setMessage(typeof detail === 'string' ? detail : 'Failed to request access.');
      });
  }, [isAuthenticated, token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-slate-600">Invalid invite link.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-slate-700 mb-4">Please log in to accept this invite.</p>
          <Link
            to={`/login?redirect=/invite/${token}`}
            className="inline-flex px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center bg-white border border-slate-200 rounded-2xl p-6 max-w-md">
        {status === 'loading' && <p className="text-slate-600">Sending join request...</p>}
        {status === 'success' && <p className="text-emerald-600">{message}</p>}
        {status === 'error' && <p className="text-rose-600">{message}</p>}
        <button
          onClick={() => navigate('/rooms')}
          className="mt-4 px-5 py-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200"
        >
          Back to Rooms
        </button>
      </div>
    </div>
  );
};

