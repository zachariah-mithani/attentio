import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ZapIcon, ArrowRightIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    identifier: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, error: authError, clearError } = useAuth();

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setLocalError('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        await register(formData.email, formData.username, formData.password);
      } else {
        await login(formData.identifier, formData.password);
      }
      onClose();
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    clearError();
    setFormData({
      email: '',
      username: '',
      identifier: '',
      password: '',
      confirmPassword: ''
    });
  };

  const displayError = localError || authError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 animate-fade-up">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-lg" />
        
        <div className="relative bg-focus-base border border-emerald-500/30 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-emerald-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-sm bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <ZapIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tighter text-white">LUMINA</span>
                <span className="text-[10px] tracking-[0.3em] text-emerald-500 font-mono block">SYSTEMS</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
              {mode === 'login' ? 'Access Terminal' : 'Create Identity'}
            </h2>
            <p className="text-sm text-emerald-500/60 font-mono mt-1">
              {mode === 'login' ? '// AUTHENTICATE TO CONTINUE' : '// INITIALIZE NEW USER PROFILE'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {mode === 'register' ? (
              <>
                <div>
                  <label className="block text-xs font-mono text-emerald-500/80 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-focus-surface border border-emerald-500/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-gray-600"
                    placeholder="user@domain.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-emerald-500/80 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full bg-focus-surface border border-emerald-500/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-gray-600"
                    placeholder="neo_learner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-emerald-500/80 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-focus-surface border border-emerald-500/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-gray-600"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-emerald-500/80 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-focus-surface border border-emerald-500/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-gray-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-mono text-emerald-500/80 uppercase tracking-wider mb-2">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className="w-full bg-focus-surface border border-emerald-500/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-gray-600"
                    placeholder="user@domain.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-emerald-500/80 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-focus-surface border border-emerald-500/30 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-gray-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            )}

            {/* Error display */}
            {displayError && (
              <div className="px-4 py-3 bg-red-950/30 border border-red-900 rounded-lg">
                <p className="text-red-400 text-sm font-mono">
                  <span className="font-bold mr-2">[ERROR]</span>
                  {displayError}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Authenticate' : 'Create Account'}
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch mode */}
            <div className="text-center pt-4 border-t border-emerald-500/10">
              <button
                type="button"
                onClick={switchMode}
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors font-mono"
              >
                {mode === 'login' 
                  ? "Don't have an account? Create Identity" 
                  : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// User dropdown component for when logged in
export const UserMenu: React.FC<{ onOpenAchievements?: () => void }> = ({ onOpenAchievements }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 transition-colors group"
      >
        <div className="w-8 h-8 rounded-sm bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
          {user.username[0].toUpperCase()}
        </div>
        <span className="text-sm font-mono text-gray-300 group-hover:text-emerald-400 transition-colors hidden sm:block">
          {user.username}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 z-50 animate-fade-up">
            <div className="bg-focus-base border border-emerald-500/30 rounded-lg overflow-hidden shadow-xl">
              <div className="px-4 py-3 border-b border-emerald-500/20">
                <p className="text-xs font-mono text-emerald-500/60 uppercase tracking-wider">Logged in as</p>
                <p className="text-sm font-mono text-white truncate">{user.email}</p>
              </div>
              <div className="p-2 space-y-1">
                {onOpenAchievements && (
                  <button
                    onClick={() => {
                      onOpenAchievements();
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-mono text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">🏆</span>
                    Achievements
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-mono text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

