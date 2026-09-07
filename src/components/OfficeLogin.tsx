import React, { useState } from 'react';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';

interface OfficeLoginProps {
  onLogin: () => void;
}

export const OfficeLogin: React.FC<OfficeLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (username.trim().toUpperCase() === 'WISDOM' && password === 'WISDOM2002') {
      sessionStorage.setItem('wisdom_admin_authenticated', 'true');
      onLogin();
      return;
    }
    setError('Invalid office username or password.');
  };

  return (
    <main className="min-h-screen bg-[#F7F8F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8E2] shadow-xl overflow-hidden">
        <div className="bg-[#2D312E] text-white p-6 text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-[#89A894] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold">Wisdom School Office</h1>
          <p className="mt-1 text-xs text-white/70">Secure fee management portal</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="office-username" className="block text-xs font-bold text-[#2D312E] mb-1.5">Username</label>
            <input
              id="office-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="w-full px-3 py-2.5 border border-[#E2E8E2] rounded-lg text-sm outline-hidden focus:ring-2 focus:ring-[#89A894]"
              required
            />
          </div>
          <div>
            <label htmlFor="office-password" className="block text-xs font-bold text-[#2D312E] mb-1.5">Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-[#6B7280]" />
              <input
                id="office-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8E2] rounded-lg text-sm outline-hidden focus:ring-2 focus:ring-[#89A894]"
                required
              />
            </div>
          </div>
          {error && <p className="text-xs font-semibold text-[#D68A6E]" role="alert">{error}</p>}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-lg text-sm font-bold transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
};
