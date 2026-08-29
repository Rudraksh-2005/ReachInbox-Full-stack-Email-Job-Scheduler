import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin as ReactGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('Demo User');
  const [email, setEmail] = useState('demo@reachinbox.ai');

  const handleSuccess = (_credentialResponse: any) => {
    localStorage.setItem('user', JSON.stringify({ id: 'user_123', name: 'Demo User', email: 'demo@reachinbox.ai' }));
    navigate('/dashboard');
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  const handleMockLogin = () => {
    localStorage.setItem('user', JSON.stringify({ id: 'user_123', name, email }));
    navigate('/dashboard');
  };

  const isDummyClient = clientId === 'dummy-client-id' || !clientId;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">ReachInbox</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to manage your email outreach</p>
        </div>
        <div className="flex flex-col items-center mt-6 space-y-4 w-full">
          {!isDummyClient ? (
            <GoogleOAuthProvider clientId={clientId}>
              <ReactGoogleLogin onSuccess={handleSuccess} onError={handleError} useOneTap />
            </GoogleOAuthProvider>
          ) : (
            <div className="w-full space-y-4">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Your Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-white placeholder-gray-600 transition-colors" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-white placeholder-gray-600 transition-colors" placeholder="e.g. john@example.com" />
                  </div>
                </div>
              </div>
              <button
                onClick={handleMockLogin}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 focus:outline-none transition-all"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

