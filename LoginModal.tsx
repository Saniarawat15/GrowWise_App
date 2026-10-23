import React, { useState } from 'react';
import {
  Sprout,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
  Compass,
  HeartHandshake,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await quickDemoLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to start demo session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl border border-stone-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: Sign In Form (7 cols on desktop) */}
        <div className="p-6 sm:p-8 md:col-span-7 flex flex-col justify-between">
          <div>
            {/* Top Toggle Switcher: Sign In vs Create Account */}
            <div className="flex items-center p-1 bg-stone-100 rounded-2xl mb-6 border border-stone-200/80">
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-stone-900 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Create Account</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                  New?
                </span>
              </button>
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-xs text-stone-500">
                    Sign in to your private GrowWise growth space
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Student Access Card */}
            <div className="mb-5 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-200 text-emerald-900 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-emerald-950">Quick Student Demo</p>
                  <p className="text-[11px] text-emerald-800">Explore preloaded features in 1 click</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemo}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                Explore
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">Password</label>
                  <button
                    type="button"
                    onClick={onSwitchToForgot}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Mobile-only "Are you new? Register" card */}
          <div className="mt-6 pt-5 border-t border-stone-100 md:hidden">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 text-center space-y-2">
              <p className="text-xs text-stone-600 font-medium">
                Are you new to GrowWise?
              </p>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>Register / Create New Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: "If you are new then register" beside Sign In (5 cols on desktop) */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-stone-950 text-white p-6 sm:p-8 md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-emerald-800/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Here? Register Today</span>
            </div>

            <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
              Create Your Account
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
              If you are new to GrowWise, take 30 seconds to register. Build real-world speaking confidence, manage academic stress, and conquer self-doubt.
            </p>

            {/* Value Highlights */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-stone-200">
                  <span className="font-semibold text-white">Private AI Mentors</span> • Practice English, presentations, and interview answers with 0 judgment.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-stone-200">
                  <span className="font-semibold text-white">Mindful Breathing & Venting</span> • Reset your nervous system when feeling mentally tired.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-stone-200">
                  <span className="font-semibold text-white">Daily Streak Engine</span> • Real-world Micro-challenges that step by step build courage.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-stone-200">
                  <span className="font-semibold text-white">100% Private & Free</span> • Your personal reflections remain exclusively yours.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/40">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>Register / Create Account</span>
              <ArrowRight className="w-4 h-4 text-stone-950" />
            </button>
            <p className="text-[11px] text-center text-stone-400 mt-2.5">
              Already have an account? Use the Sign In form on the left.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

