import React, { useState } from 'react';
import { Sprout, Sparkles, Flame, WifiOff, Heart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../../types';

interface NavbarProps {
  onOpenCompanion: () => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCompanion, currentTab, onSelectTab }) => {
  const { user, isOffline, setShowEmergencyModal } = useAuth();
  const [showStreakModal, setShowStreakModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-hidden group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-lg tracking-tight text-stone-900">GrowWise</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium hidden sm:inline-block">Student</span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium tracking-wide hidden sm:block">Grow with confidence. Learn with purpose.</p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline Pill */}
          {isOffline && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Offline Mode</span>
            </div>
          )}

          {/* Streak Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowStreakModal(!showStreakModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 transition-colors text-xs font-bold"
              title="Growth Streak"
            >
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
              <span>{user?.streak_count || 1}d</span>
            </button>

            {showStreakModal && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-600 fill-orange-500" />
                  <h4 className="font-bold text-sm text-stone-900">{user?.streak_count || 1} Day Growth Streak</h4>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-3">
                  You build momentum every day you check in with yourself, practice speaking, or tackle a confidence challenge.
                </p>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 font-medium">
                  🌱 <em>Miss a day? That's okay. Growth isn't ruined by one missed day. Start again today.</em>
                </div>
                <button
                  onClick={() => setShowStreakModal(false)}
                  className="mt-3 w-full py-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium"
                >
                  Got it
                </button>
              </div>
            )}
          </div>

          {/* AI Coach Quick Trigger */}
          <button
            onClick={onOpenCompanion}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Companion</span>
            <span className="sm:hidden">Coach</span>
          </button>

          {/* Safety / Help Button */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Crisis & Helpline Support"
            aria-label="Crisis Support"
          >
            <Heart className="w-4 h-4" />
          </button>

          {/* Profile Shortcut */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`p-2 rounded-xl border transition-colors ${
              currentTab === 'profile'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                : 'border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
            title="Profile & Settings"
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
