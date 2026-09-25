import React, { useEffect, useState, useMemo } from 'react';
import { getDistricts, getStates, loginUser, registerUser, PublicDistrict, PublicState } from '../api';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
  initialState?: string;
  initialDistrict?: string;
  onSuccess: (user: { name: string; email: string; state: string; district: string }, token: string) => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signin',
  initialState,
  initialDistrict,
  onSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States & Districts loaded directly from MongoDB
  const [publishedStates, setPublishedStates] = useState<PublicState[]>([]);
  const [stateDistricts, setStateDistricts] = useState<Record<string, PublicDistrict[]>>({});

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInState, setSignInState] = useState(initialState || '');
  const [signInDistrict, setSignInDistrict] = useState(initialDistrict || '');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpState, setSignUpState] = useState(initialState || '');
  const [signUpDistrict, setSignUpDistrict] = useState(initialDistrict || '');
  const [explorerRole, setExplorerRole] = useState('Heritage Enthusiast');
  const [termsAgreed, setTermsAgreed] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getStates()
      .then(async (states) => {
        if (!isMounted || !states || states.length === 0) return;
        const entries = await Promise.all(
          states.map(async (state) => {
            const dists = await getDistricts(state._id);
            return [state.name, dists || []] as const;
          })
        );
        if (isMounted) {
          setPublishedStates(states);
          const mappedDistricts = Object.fromEntries(entries);
          setStateDistricts(mappedDistricts);
          if (!signInState && states[0]) {
            setSignInState(states[0].name);
            setSignUpState(states[0].name);
            const firstDist = mappedDistricts[states[0].name]?.[0]?.name || '';
            setSignInDistrict(firstDist);
            setSignUpDistrict(firstDist);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load published states from database:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialState && publishedStates.length > 0) {
      const match = publishedStates.find(
        (s) => s.name.toLowerCase() === initialState.toLowerCase() || s.code.toLowerCase() === initialState.toLowerCase()
      );
      if (match) {
        setSignInState(match.name);
        setSignUpState(match.name);
        const dists = stateDistricts[match.name] || [];
        const distMatch = dists.find((d) => d.name.toLowerCase() === (initialDistrict || '').toLowerCase());
        const selectedDist = distMatch ? distMatch.name : (dists[0]?.name || initialDistrict || '');
        setSignInDistrict(selectedDist);
        setSignUpDistrict(selectedDist);
      }
    }
  }, [initialState, initialDistrict, publishedStates, stateDistricts]);

  const districtsForSignUpState = useMemo(() => {
    return stateDistricts[signUpState] || [];
  }, [stateDistricts, signUpState]);

  const districtsForSignInState = useMemo(() => {
    return stateDistricts[signInState] || [];
  }, [stateDistricts, signInState]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setToastMessage('Please fill in both email and password.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setToastMessage('Signing in...');
    loginUser(signInEmail.trim(), signInPassword)
      .then(({ user, token }) => onSuccess(user, token))
      .catch((error: Error) => setToastMessage(error.message));
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpState || !signUpDistrict) {
      setToastMessage('Please complete all required fields.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!termsAgreed) {
      setToastMessage('Please agree to the Heritage Preservation Charter.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setToastMessage('Creating account...');
    registerUser({ name: signUpName, email: signUpEmail, password: signUpPassword, state: signUpState, district: signUpDistrict })
      .then(({ user, token }) => onSuccess(user, token))
      .catch((error: Error) => setToastMessage(error.message));
  };

  return (
    <div className="w-full min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative animate-fadeIn">
      {/* Background Decorative Graphic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#a14009]/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#cca730]/10 blur-3xl"></div>
      </div>

      {/* Main Auth Card */}
      <div className="relative z-10 w-full max-w-xl bg-white rounded-3xl shadow-xl border border-[#e2e2e2] overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#1c1b1b] to-[#2f3131] px-8 py-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a14009] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-[24px]">account_balance</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-300/90 font-bold block">
                  Archaeological Survey &amp; GIS
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                  Indian Heritage Portal
                </h2>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="text-neutral-400 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
              title="Return to Explorer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
            Access centrally protected monuments, your digital field passport, and high-fidelity photogrammetric monographs.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-black/30 p-1 rounded-xl mt-5 border border-white/10">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#a14009] text-white shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#a14009] text-white shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {mode === 'signin' ? (
            /* SIGN IN FORM */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1.5">
                  Explorer Email or Patron ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#747878] text-[20px]">
                    mail
                  </span>
                  <input
                    type="text"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="explorer@heritage.org or ASI Patron #9402"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748]">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setToastMessage('A password recovery link has been sent to your email.');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="text-xs text-[#a14009] hover:underline font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#747878] text-[20px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#747878] hover:text-[#1a1c1c] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Exploration Base City Selection on Sign In */}
              <div className="bg-[#f2f2f2] p-3 rounded-xl border border-[#e2e2e2]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#444748] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#a14009]">location_on</span>
                  <span>Target Exploration City / Base</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={signInState}
                    onChange={(e) => {
                      setSignInState(e.target.value);
                      const districts = stateDistricts[e.target.value] || [];
                      if (districts.length > 0) {
                        setSignInDistrict(districts[0].name);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#c4c7c7] bg-white text-[#1a1c1c] focus:outline-none focus:ring-1 focus:ring-[#a14009]"
                  >
                    {publishedStates.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>

                  <select
                    value={signInDistrict}
                    onChange={(e) => setSignInDistrict(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#c4c7c7] bg-white text-[#1a1c1c] focus:outline-none focus:ring-1 focus:ring-[#a14009]"
                  >
                    {districtsForSignInState.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#444748]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#a14009] focus:ring-[#a14009]"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#a14009] hover:bg-[#853407] text-white font-semibold text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In &amp; Enter {signInDistrict}</span>
              </button>

              {/* Account access is provided through the real backend account. */}
              <div className="pt-3 border-t border-[#e2e2e2]">
                <span className="block text-[11px] text-[#747878] text-center">
                  Use your registered heritage account to continue.
                </span>
              </div>
              {false && <div className="hidden">
                </div>}
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="rahul@domain.org"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                  Create Security Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-3.5 pr-10 py-2 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-[#747878] hover:text-[#1a1c1c] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                    Primary Heritage State
                  </label>
                  <select
                    required
                    value={signUpState}
                    onChange={(e) => {
                      setSignUpState(e.target.value);
                      const districts = stateDistricts[e.target.value] || [];
                      if (districts.length > 0) {
                        setSignUpDistrict(districts[0].name);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                  >
                    {!publishedStates.length && <option value="">No Admin-published states yet</option>}
                    {publishedStates.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                    Home Base District / City
                  </label>
                  <select
                    required
                    value={signUpDistrict}
                    onChange={(e) => setSignUpDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                  >
                    {!districtsForSignUpState.length && <option value="">No districts available</option>}
                    {districtsForSignUpState.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                  Explorer Designation
                </label>
                <select
                  value={explorerRole}
                  onChange={(e) => setExplorerRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#c4c7c7] bg-[#f9f9f9] text-[#1a1c1c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                >
                  <option value="Heritage Enthusiast">Heritage Enthusiast &amp; Traveller</option>
                  <option value="Architecture Student">Architecture &amp; Epigraphy Scholar</option>
                  <option value="History Researcher">Archaeological Researcher / Historian</option>
                  <option value="Conservation Volunteer">Conservation Patron &amp; Volunteer</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-[#444748]">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-[#a14009] focus:ring-[#a14009]"
                  />
                  <span>
                    I accept the National Heritage Preservation Charter and agree to ethical, leave-no-trace exploration.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#a14009] hover:bg-[#853407] text-white font-semibold text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Complete Profile &amp; Enter {signUpDistrict}</span>
              </button>
            </form>
          )}

          {false && <div className="hidden">
            <button
              type="button"
              onClick={() => setToastMessage('Use your registered email and password.')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#c4c7c7] hover:bg-[#f3f3f3] text-xs font-semibold text-[#1a1c1c] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Account</span>
            </button>

            <button
              type="button"
              onClick={() => setToastMessage('Use your registered email and password.')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#c4c7c7] hover:bg-[#f3f3f3] text-xs font-semibold text-[#1a1c1c] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#a14009]">
                badge
              </span>
              <span>DigiLocker / ASI</span>
            </button>
          </div>}

          {/* Return to Overview Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#747878] hover:text-[#a14009] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Back to Overview Landing Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1c1b1b] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-amber-400 text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
