import React, { useState } from 'react';
import { Sprout, User, Award, School, Heart, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OnboardingModalProps {
  onComplete?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { user, updateProfile } = useAuth();

  const [realName, setRealName] = useState(user?.real_name || user?.name || '');
  const [nickname, setNickname] = useState(user?.nickname || user?.name?.split(' ')[0] || '');
  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [collegeName, setCollegeName] = useState(user?.college_name || '');
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '20');
  const [educationLevel, setEducationLevel] = useState(user?.education_level || 'Undergraduate (3rd Year)');
  const [mainGrowthGoal, setMainGrowthGoal] = useState(
    user?.main_growth_goal || 'Speak English more confidently & conquer presentation anxiety'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please provide a nickname or preferred name for your AI Mentor to address you.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await updateProfile({
        name: realName.trim() || nickname.trim(),
        real_name: realName.trim() || nickname.trim(),
        nickname: nickname.trim(),
        student_id: studentId.trim(),
        college_name: collegeName.trim(),
        age: age ? parseInt(age, 10) : undefined,
        education_level: educationLevel,
        main_growth_goal: mainGrowthGoal,
        onboarding_completed: true,
      });
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save your basic info.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goalOptions = [
    'Speak English more confidently & conquer presentation anxiety',
    'Safe emotional venting & overcoming self-doubt',
    'Manage exam panic, study schedules & procrastination',
    'Prepare for campus placement interviews & resume reviews',
    'Build daily speaking & social confidence step-by-step',
    'Learn personal boundaries & adulting life transitions',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 mx-auto mb-3.5 flex items-center justify-center text-white shadow-md">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-stone-900 tracking-tight">
            Welcome to GrowWise 🌱
          </h2>
          <p className="text-sm text-stone-600 mt-1.5 max-w-md mx-auto">
            Let&apos;s personalize your safe growth space. Your AI Mentors will use this information to tailor their guidance and address you respectfully.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Names Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Nickname / Preferred Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                How your AI Mentors will address you warmly in conversations.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Full / Real Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="e.g. Alexander Chen"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                Your full official name for certificates & profile.
              </p>
            </div>
          </div>

          {/* College and ID Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Student ID / Roll No.
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. Student ID / Roll No."
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                College / University / School
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. College or University name"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          {/* Age & Education Level */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-stone-800 mb-1">Age</label>
              <input
                type="number"
                min="13"
                max="99"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="20"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
              >
                <option value="High School Student">High School Student</option>
                <option value="Undergraduate (1st Year)">Undergraduate (1st Year)</option>
                <option value="Undergraduate (2nd Year)">Undergraduate (2nd Year)</option>
                <option value="Undergraduate (3rd Year)">Undergraduate (3rd Year)</option>
                <option value="Undergraduate (Final Year)">Undergraduate (Final Year)</option>
                <option value="Postgraduate / Master's">Postgraduate / Master&apos;s</option>
                <option value="Recent Graduate / Job Seeker">Recent Graduate / Job Seeker</option>
              </select>
            </div>
          </div>

          {/* Primary Growth Goal */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              What is your primary growth goal right now?
            </label>
            <select
              value={mainGrowthGoal}
              onChange={(e) => setMainGrowthGoal(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
            >
              {goalOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Safe Privacy Callout */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-2.5 text-xs text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Safe & Confidential:</strong> GrowWise is your personal private sanctuary. You can update your identity details at any time from your Profile.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Profile...' : 'Begin My Journey'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
