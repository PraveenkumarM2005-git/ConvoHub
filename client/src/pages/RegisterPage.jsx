// ============================================================
// RegisterPage — Create new account with ConvoHub branding
// Matches the dark obsidian theme from reference UI
// ============================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const { register, error, clearError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Cryptographic keys do not match.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Key must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    await register(name, email, password);
    setIsSubmitting(false);
  };

  const displayError = localError || error;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-[#0A0A0F] to-[#0B1015] relative overflow-hidden">


      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen translate-y-1/2 -translate-x-1/2"></div>

      {/* Huge background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03]">
        <h1 className="text-[20vh] font-black text-white whitespace-nowrap -rotate-12 tracking-tighter mix-blend-overlay select-none">
          CONVOHUB
        </h1>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo icon */}
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[#111118] border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#convoGradientRegister)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="convoGradientRegister" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <path d="M17 6.5A4.5 4.5 0 0 0 12.5 2H8a5 5 0 0 0-5 5v5a5 5 0 0 0 5 5h1l1 4 3-4h1a4.5 4.5 0 0 0 4.5-4.5z" />
              <path d="M16 11h2.5A4.5 4.5 0 0 1 23 15.5v2L24 22l-4-1h-1.5a4.5 4.5 0 0 1-4.5-4.5V11" />
            </svg>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </div>

          <h1 className="text-2xl font-bold text-dark-50 tracking-tight">
            ConvoHub
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-dark-200 mt-1">
            Secure Registration Protocol
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-card w-full p-8 shadow-2xl relative overflow-hidden">
          <h2 className="text-lg font-semibold text-dark-50 mb-1">
            Request Access
          </h2>
          <p className="text-sm text-dark-200 mb-6">
            Initialize your secure identity within the network.
          </p>

          {/* Error message */}
          {displayError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm fade-in">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field */}
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase text-dark-200 mb-2 font-medium">
                Identity Handle
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError();
                    setLocalError("");
                  }}
                  placeholder="Your display name"
                  className="input-field pl-11"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase text-dark-200 mb-2 font-medium">
                Access Identifier
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0z" />
                    <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-5.5 8.28" />
                  </svg>
                </span>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                    setLocalError("");
                  }}
                  placeholder="user@convohub.local"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase text-dark-200 mb-2 font-medium">
                Cryptographic Key
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                    setLocalError("");
                  }}
                  placeholder="Min 6 characters"
                  className="input-field pl-11 pr-11"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-100 transition-colors"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password field */}
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase text-dark-200 mb-2 font-medium">
                Confirm Key
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setLocalError("");
                  }}
                  placeholder="Re-enter your key"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              id="register-submit"
              type="submit"
              disabled={isSubmitting || !name || !email || !password || !confirmPassword}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  Initialize Identity
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-sm text-dark-200">
          Already have access?{" "}
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Authorize Connection
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
