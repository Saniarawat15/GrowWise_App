import React, { useState } from 'react';
import { Sprout, User, Mail, Lock, AlertCircle, ArrowRight, Sparkles, Check, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterModalProps {
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [realName, setRealName] = useState('');
  const [nickname, setNickname] = useState('');
  const [studentId, setStudentId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate (3rd/Final Year)');
  const [mainGrowthGoal, setMainGrowthGoal] = useState('Improve confidence & public speaking');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const chosenNickname = nickname.trim() || realName.trim().split(' ')[0] || 'Friend';
      await register({
        name: realName.trim(),
        real_name: realName.trim(),
        nickname: chosenNickname,
        student_id: studentId.trim() || `GW-${Math.floor(1000 + Math.random() * 9000)}`,
        college_name: collegeName.trim() || 'College / University',
        email,
        password,
        confirmPassword,
        age: age ? parseInt(age, 10) : undefined,
        education_level: educationLevel,
        main_growth_goal: mainGrowthGoal,
        onboarding_completed: true,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const goalOptions = [
    'Improve confidence & public speaking',
    'Improve spoken & written English',
    'Become better at communication & group discussions',
    'Prepare for campus placements & interviews',
    'Manage academic stress & self-doubt',
    'Develop consistent daily growth habits',
    'General personal growth & self-reflection',
  ];

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl border border-stone-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: Register Form (7 cols on desktop) */}
        <div className="p-6 sm:p-8 md:col-span-7 flex flex-col justify-between">
          <div>
            {/* Top Toggle Switcher */}
            <div className="flex items-center p-1 bg-stone-100 rounded-2xl mb-6 border border-stone-200/80">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-stone-900 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Create Account</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                  New
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Create Your Space
                </h2>
                <p className="text-xs text-stone-500">
                  Begin your private, empowering journey with GrowWise
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full / Real Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="e.g. Alexander Chen"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nickname <span className="text-emerald-700 font-normal">(AI calls you this)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Student ID / Roll No.
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. CS-2024-819"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    College / Institution
                  </label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Apex Tech Institute"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@college.edu"
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="14"
                    max="99"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  >
                    <option value="High School">High School</option>
                    <option value="Undergraduate (1st/2nd Year)">Undergrad (1st/2nd Year)</option>
                    <option value="Undergraduate (3rd/Final Year)">Undergrad (3rd/Final Year)</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Young Professional">Young Professional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Primary Growth Goal</label>
                <select
                  value={mainGrowthGoal}
                  onChange={(e) => setMainGrowthGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                >
                  {goalOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100 text-center md:hidden">
            <p className="text-xs text-stone-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Right Column: Already a member panel beside registration */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-emerald-950 text-white p-6 sm:p-8 md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-stone-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 text-emerald-300 border border-stone-700 text-[11px] font-bold mb-4">
              <LogIn className="w-3.5 h-3.5" />
              <span>Already Registered?</span>
            </div>

            <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
              Welcome Back
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
              Already have your student account? Sign in directly to continue your confidence streak and active chats.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-stone-200">
                  <span className="font-semibold text-white">Daily Streak Sync</span> • Your streak and journals are automatically preserved.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-stone-200">
                  <span className="font-semibold text-white">AI Mentor Continuity</span> • Pick up right where you left off with Maya, Arjun, or Serena.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-stone-200">
                  <span className="font-semibold text-white">Safe & Secure</span> • Encrypted credentials and password protected data.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>Sign In to Existing Account</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <p className="text-[11px] text-center text-stone-400 mt-2.5">
              Instant login with your email and password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
