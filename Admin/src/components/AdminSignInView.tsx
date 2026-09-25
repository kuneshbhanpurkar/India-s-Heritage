import React, { useState } from 'react';
import { AdminOfficer } from '../types';
import { loginAdmin } from '../api';

export interface AdminSignInViewProps {
  onSignIn: (officer: AdminOfficer, token: string) => void;
  onCancel?: () => void;
  currentOfficer?: AdminOfficer;
  brandTitle?: string;
  brandHindi?: string;
  portalSubtitle?: string;
}

export const AdminSignInView: React.FC<AdminSignInViewProps> = ({
  onSignIn,
  onCancel,
  currentOfficer,
  brandTitle = 'Dharohar',
  brandHindi = 'धरोहर',
  portalSubtitle = 'National Heritage Portal • Archaeological Survey of India',
}) => {
  const [email, setEmail] = useState(currentOfficer?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your official email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    loginAdmin(email.trim(), password)
      .then(({ token, admin }) => {
        sessionStorage.setItem('dharohar_admin_token', token);
        onSignIn({
          ...admin,
          code: `#ADM-${admin.id.slice(-4).toUpperCase()}`,
          designation: admin.role === 'super_admin' ? 'Director General' : 'Circle Administrator',
          role: admin.role === 'super_admin' ? 'Super Admin' : 'Circle Admin',
          status: 'Active',
          circle: 'National Portal',
        }, token);
      })
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen w-full bg-[#0e0d0b] text-stone-100 flex flex-col justify-between selection:bg-amber-600 selection:text-white relative overflow-hidden font-sans antialiased">
      {/* Subtle Warm Radial Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-amber-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[320px] bg-amber-900/10 blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-xl">account_balance</span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              {brandTitle} {brandHindi && <span className="text-amber-400 font-normal text-xs">{brandHindi}</span>}
            </div>
            <p className="text-[0.68rem] text-stone-400">
              {portalSubtitle}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-stone-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 bg-stone-900/60 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Portal</span>
          </button>
        )}
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* Card Wrapper */}
          <div className="bg-[#171513] border border-stone-800/90 rounded-2xl p-7 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-sm">
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Administrative Access
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Sign In</h1>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                Enter your official email and password to access the heritage management portal.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-red-400 text-base shrink-0">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Information Banner */}
            {infoMessage && (
              <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs flex items-start justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-base shrink-0">info</span>
                  <span>{infoMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoMessage(null)}
                  className="text-stone-400 hover:text-stone-200 text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Sign In Form (ONLY Email & Password) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-300">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 material-symbols-outlined text-stone-500 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@asi.gov.in"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#0f0e0c] border border-stone-800 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-stone-300">Password</label>
                  <button
                    type="button"
                    onClick={() =>
                      setInfoMessage(
                        'Password reset: please reach out to the ASI Technical Directorate at support@asi.gov.in or contact your circle supervisor.'
                      )
                    }
                    className="text-[0.68rem] text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 material-symbols-outlined text-stone-500 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-[#0f0e0c] border border-stone-800 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-stone-500 hover:text-stone-300 transition-colors"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-stone-900 border-stone-700 text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      </main>

      {/* Minimal Aesthetic Sovereign Footer */}
      <footer className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[0.7rem] text-stone-500">
        <div className="flex items-center gap-2">
          <span>Archaeological Survey of India</span>
          <span>•</span>
          <span>Ministry of Culture, Govt. of India</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setInfoMessage('Official Helpdesk: Archaeological Survey of India, Janpath, New Delhi • Email: support@asi.gov.in')
            }
            className="hover:text-stone-400 transition-colors"
          >
            Support
          </button>
          <span>•</span>
          <span className="text-stone-600">Dharohar Portal v4.8</span>
        </div>
      </footer>
    </div>
  );
};
