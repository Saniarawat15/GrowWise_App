import React, { useState } from 'react';
import {
  User as UserIcon,
  Flame,
  Award,
  TrendingUp,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  Edit2,
  Lock,
  Download,
  Trash2,
  RotateCcw,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';
import { NavigationTab } from '../../types';
import { StreakCounterCard } from '../common/StreakCounterCard';
import { BadgeSection } from './BadgeSection';

interface ProfileHubProps {
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenJournalEditor?: () => void;
  onOpenCompanion?: () => void;
}

export const ProfileHub: React.FC<ProfileHubProps> = ({
  onNavigateTab,
  onOpenJournalEditor,
  onOpenCompanion,
}) => {
  const {
    user,
    stats,
    logout,
    updateProfile,
    changePassword,
    refreshStats,
    setShowEmergencyModal,
  } = useAuth();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Edit Profile Form
  const [name, setName] = useState(user?.name || '');
  const [realName, setRealName] = useState(user?.real_name || user?.name || '');
  const [nickname, setNickname] = useState(user?.nickname || user?.name?.split(' ')[0] || '');
  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [collegeName, setCollegeName] = useState(user?.college_name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [educationLevel, setEducationLevel] = useState(
    user?.education_level || 'Undergraduate (3rd/Final Year)'
  );
  const [mainGrowthGoal, setMainGrowthGoal] = useState(
    user?.main_growth_goal || 'Improve confidence & public speaking'
  );
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Settings State (persisted in localStorage)
  const [aiLength, setAiLength] = useState(() => localStorage.getItem('gw_ai_length') || 'Balanced');
  const [englishLevel, setEnglishLevel] = useState(
    () => localStorage.getItem('gw_english_level') || 'Intermediate'
  );
  const [dailyReminders, setDailyReminders] = useState(
    () => localStorage.getItem('gw_daily_reminders') !== 'false'
  );

  const handleSaveSettings = () => {
    localStorage.setItem('gw_ai_length', aiLength);
    localStorage.setItem('gw_english_level', englishLevel);
    localStorage.setItem('gw_daily_reminders', dailyReminders.toString());
    setIsSettingsOpen(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const chosenNickname = nickname.trim() || realName.trim().split(' ')[0] || 'Friend';
      await updateProfile({
        name: realName.trim() || name.trim(),
        real_name: realName.trim() || name.trim(),
        nickname: chosenNickname,
        student_id: studentId.trim(),
        college_name: collegeName.trim(),
        age: age ? parseInt(age, 10) : undefined,
        education_level: educationLevel,
        main_growth_goal: mainGrowthGoal,
      });
      setIsEditProfileOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess('Password successfully updated!');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [goals, journals, statsData] = await Promise.all([
        api.getGoals(),
        api.getJournal(),
        api.getStats(),
      ]);
      const exportObject = {
        app: 'GrowWise',
        user: {
          name: user?.name,
          email: user?.email,
          education: user?.education_level,
          goal: user?.main_growth_goal,
        },
        exportDate: new Date().toISOString(),
        stats: statsData,
        goals,
        journals,
      };

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growwise-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export data.');
    }
  };

  const handleClearJournals = async () => {
    if (window.confirm('Delete all your journal entries? This action cannot be reversed.')) {
      await api.clearJournal();
      refreshStats();
      alert('All journal entries have been cleared.');
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo data back to clean starting state?')) {
      await api.resetDemoData();
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you absolutely sure? Type "DELETE" in capital letters to permanently delete your account and all data:'
    );
    if (confirmation === 'DELETE') {
      await api.deleteAccount();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Profile Banner */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center font-heading text-2xl font-bold shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-stone-900">
                  {user?.real_name || user?.name}
                </h2>
                {user?.nickname && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    &ldquo;{user.nickname}&rdquo;
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Active
                </span>
              </div>
              <p className="text-xs text-stone-500">{user?.email}</p>
              <p className="text-xs text-stone-600 mt-1 font-medium">
                {user?.college_name ? `${user.college_name} • ` : ''}
                {user?.student_id ? `ID: ${user.student_id} • ` : ''}
                {user?.education_level || 'College Student'}
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Focus: {user?.main_growth_goal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setName(user?.name || '');
                setRealName(user?.real_name || user?.name || '');
                setNickname(user?.nickname || user?.name?.split(' ')[0] || '');
                setStudentId(user?.student_id || '');
                setCollegeName(user?.college_name || '');
                setAge(user?.age?.toString() || '');
                setEducationLevel(user?.education_level || 'Undergraduate (3rd/Final Year)');
                setMainGrowthGoal(user?.main_growth_goal || 'Improve confidence & public speaking');
                setIsEditProfileOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Streak Counter & Non-Guilt Model Card */}
      <StreakCounterCard
        streak={stats?.dailyGrowthStreak}
        onRefresh={refreshStats}
        showSimulateButtons={true}
      />

      {/* 3. Progress Overview Stats Grid */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Growth Metrics Overview</span>
          </h3>
          <span className="text-xs text-stone-400">Continuous Tracking</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Confidence Index</span>
            <p className="font-heading text-xl font-bold text-emerald-800 mt-1">
              {stats?.confidencePercent || 72}%
            </p>
            <span className="text-[10px] text-stone-400 font-medium">Challenges & Practice</span>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">English Clarity</span>
            <p className="font-heading text-xl font-bold text-teal-800 mt-1">
              {stats?.englishOverall || 70}%
            </p>
            <span className="text-[10px] text-stone-400 font-medium">Speaking & Fluency</span>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Daily Practices</span>
            <p className="font-heading text-xl font-bold text-purple-800 mt-1">
              {stats?.dailyActivitiesCompleted || 18}
            </p>
            <span className="text-[10px] text-stone-400 font-medium">Habits Checked</span>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Journal Entries</span>
            <p className="font-heading text-xl font-bold text-amber-800 mt-1">
              {stats?.journalCount || 3}
            </p>
            <span className="text-[10px] text-stone-400 font-medium">Reflections Saved</span>
          </div>
        </div>
      </div>

      {/* 4. Key Achievement Badges Section */}
      <BadgeSection
        badges={stats?.badges || []}
        onNavigateTab={onNavigateTab}
        onOpenJournalEditor={onOpenJournalEditor}
        onOpenCompanion={onOpenCompanion}
      />

      {/* 5. Settings & Account Options */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs divide-y divide-stone-100">
        <h3 className="font-heading text-base font-bold text-stone-900 pb-3">Preferences & Security</h3>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full py-3.5 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-stone-500" />
            <div>
              <p className="text-xs font-semibold text-stone-900">AI & Coaching Preferences</p>
              <p className="text-[11px] text-stone-500">Pacing, response style, difficulty</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">Edit</span>
        </button>

        <button
          onClick={() => setIsChangePasswordOpen(true)}
          className="w-full py-3.5 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-stone-500" />
            <div>
              <p className="text-xs font-semibold text-stone-900">Change Password</p>
              <p className="text-[11px] text-stone-500">Update your account credentials</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">Update</span>
        </button>

        <button
          onClick={handleExportData}
          className="w-full py-3.5 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-stone-500" />
            <div>
              <p className="text-xs font-semibold text-stone-900">Export My Data (JSON)</p>
              <p className="text-[11px] text-stone-500">Download goals, reflections, and progress stats</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">Export</span>
        </button>

        <button
          onClick={() => setShowEmergencyModal(true)}
          className="w-full py-3.5 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3 text-emerald-800">
            <HeartHandshake className="w-4 h-4 text-emerald-700" />
            <div>
              <p className="text-xs font-semibold text-emerald-950">Crisis & Real-World Support</p>
              <p className="text-[11px] text-emerald-800">24/7 helplines, counselors, emergency contacts</p>
            </div>
          </div>
          <span className="text-xs text-emerald-700 font-semibold">View</span>
        </button>

        <button
          onClick={() => setIsAboutOpen(true)}
          className="w-full py-3.5 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-stone-500" />
            <div>
              <p className="text-xs font-semibold text-stone-900">About GrowWise & Presentation</p>
              <p className="text-[11px] text-stone-500">College project architecture, principles, mission</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">About</span>
        </button>

        <button
          onClick={handleResetDemo}
          className="w-full py-3.5 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-xs font-semibold text-amber-900">Reset Demo Account</p>
              <p className="text-[11px] text-stone-500">Restore default demo activities and journals</p>
            </div>
          </div>
          <span className="text-xs text-amber-700 font-semibold">Reset</span>
        </button>

        <button
          onClick={logout}
          className="w-full py-3.5 flex items-center justify-between text-left hover:bg-stone-50 px-2 rounded-xl transition-colors text-rose-700"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4" />
            <div>
              <p className="text-xs font-semibold">Sign Out</p>
              <p className="text-[11px] text-stone-400">Safely end this session</p>
            </div>
          </div>
          <span className="text-xs font-semibold">Sign Out</span>
        </button>
      </div>

      {/* Danger Zone: Data deletion */}
      <div className="p-5 bg-rose-50/50 rounded-3xl border border-rose-200 space-y-3">
        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Privacy & Danger Zone</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleClearJournals}
            className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-xl border border-rose-300 transition-colors"
          >
            Clear All Journals
          </button>
          <button
            onClick={handleDeleteAccount}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Delete Account Permanently
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 relative">
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading text-lg font-bold text-stone-900 mb-3">Edit Profile</h3>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full / Real Name</label>
                  <input
                    type="text"
                    required
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nickname (AI calls you)</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Alex"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Student ID / Roll No.</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">College / School</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Education Level</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                >
                  <option value="High School">High School</option>
                  <option value="Undergraduate (1st/2nd Year)">Undergrad (1st/2nd Year)</option>
                  <option value="Undergraduate (3rd/Final Year)">Undergrad (3rd/Final Year)</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Young Professional">Young Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Primary Growth Goal</label>
                <input
                  type="text"
                  value={mainGrowthGoal}
                  onChange={(e) => setMainGrowthGoal(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 relative">
            <button
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading text-lg font-bold text-stone-900 mb-3">Change Password</h3>

            {passwordError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading text-lg font-bold text-stone-900 mb-1">AI & Coaching Preferences</h3>
            <p className="text-xs text-stone-500 mb-4">Customize how GrowWise coaches you.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">AI Response Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Concise', 'Balanced', 'Detailed'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAiLength(opt)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        aiLength === opt
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">English Practice Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setEnglishLevel(lvl)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        englishLevel === lvl
                          ? 'border-teal-600 bg-teal-50 text-teal-900'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-xs font-semibold text-stone-900 block">Daily Growth Reminders</span>
                  <span className="text-[11px] text-stone-500">Gentle encouragement to check in</span>
                </div>
                <input
                  type="checkbox"
                  checked={dailyReminders}
                  onChange={(e) => setDailyReminders(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About GrowWise Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-emerald-800">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-bold text-stone-900">About GrowWise</h3>
            </div>

            <p className="text-xs text-stone-500 font-semibold mb-4">
              "Grow with confidence. Learn with purpose."
            </p>

            <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 font-medium">
                🌱 <strong>Core Purpose:</strong> GrowWise is built specifically for students and young adults to build independent confidence, English speaking competence, and healthy reflective habits.
              </div>

              <p>
                <strong>Architecture Highlights:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Full-stack architecture (React, TypeScript, Express, Vite).</li>
                <li>MySQL relational schema mapping users, goals, journals, and activities.</li>
                <li>Gemini API integration with safety-first system instructions.</li>
                <li>Situation → Thought → Reality → Action 4-step framework.</li>
                <li>Offline-first client caching to safeguard student work.</li>
              </ul>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <strong className="text-stone-900 block mb-1">Ethical AI Principle:</strong>
                "The AI should empower the user to become more confident and independent, not make the user emotionally dependent on the AI."
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsAboutOpen(false)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
