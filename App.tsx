import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationTab } from './types';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { EmergencyModal } from './components/common/EmergencyModal';
import { SplashScreen } from './components/auth/SplashScreen';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { HomeDashboard } from './components/home/HomeDashboard';
import { AICompanionView } from './components/companion/AICompanionView';
import { GrowHub } from './components/grow/GrowHub';
import { PracticeHub } from './components/practice/PracticeHub';
import { JournalHub } from './components/reflect/JournalHub';
import { GoalsHub } from './components/goals/GoalsHub';
import { ProfileHub } from './components/profile/ProfileHub';
import { WifiOff, Target, User } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading, isOffline } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('growwise_onboarding_seen') !== 'true';
  });
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [companionInitialPrompt, setCompanionInitialPrompt] = useState<string | undefined>();
  const [companionInitialMode, setCompanionInitialMode] = useState<string | undefined>();
  const [companionInitialVent, setCompanionInitialVent] = useState<boolean>(false);
  const [profileSubSection, setProfileSubSection] = useState<'profile' | 'goals'>('profile');

  // Handle splash complete
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    localStorage.setItem('growwise_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const handleOpenCompanion = (prompt?: string, mode?: string, vent?: boolean) => {
    setCompanionInitialPrompt(prompt);
    setCompanionInitialMode(mode);
    setCompanionInitialVent(!!vent);
    setIsCompanionOpen(true);
  };

  // Show splash on initial launch
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // If loading user state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 animate-pulse flex items-center justify-center text-white" />
          <span className="text-xs font-semibold text-stone-500">Loading GrowWise...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render auth views
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-between">
        <header className="p-4 border-b border-stone-200/70 bg-white/70 backdrop-blur-xs flex items-center justify-center">
          <span className="font-heading font-extrabold text-xl text-stone-900 tracking-tight">
            GrowWise 🌱
          </span>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full flex items-center justify-center p-2 sm:p-4">
          {authView === 'login' && (
            <LoginModal
              onSwitchToRegister={() => setAuthView('register')}
              onSwitchToForgot={() => setAuthView('forgot')}
            />
          )}
          {authView === 'register' && (
            <RegisterModal onSwitchToLogin={() => setAuthView('login')} />
          )}
          {authView === 'forgot' && (
            <ForgotPasswordModal onBackToLogin={() => setAuthView('login')} />
          )}
        </main>

        <footer className="p-4 text-center text-xs text-stone-400">
          &ldquo;Grow with confidence. Learn with purpose.&rdquo;
        </footer>
      </div>
    );
  }

  // Show onboarding if basic info not completed yet
  if (user && user.onboarding_completed === false) {
    return <OnboardingModal onComplete={handleOnboardingComplete} />;
  }

  // Main Authenticated Application Flow
  return (
    <div className="min-h-screen bg-stone-100/50 text-stone-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-stone-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode: Changes are saved locally to your device and will sync when reconnected.</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenCompanion={() => handleOpenCompanion()}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsCompanionOpen(false);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-24">
        {isCompanionOpen ? (
          <AICompanionView
            onClose={() => setIsCompanionOpen(false)}
            initialPrompt={companionInitialPrompt}
            initialMode={companionInitialMode}
            initialVentMode={companionInitialVent}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeDashboard
                onSelectTab={setCurrentTab}
                onOpenCompanion={handleOpenCompanion}
                onOpenJournalEditor={() => setCurrentTab('reflect')}
              />
            )}

            {currentTab === 'grow' && <GrowHub />}

            {currentTab === 'practice' && <PracticeHub />}

            {currentTab === 'reflect' && <JournalHub />}

            {currentTab === 'profile' && (
              <div className="space-y-4">
                {/* Profile Sub-toggle between Profile Settings & Active Goals */}
                <div className="bg-white p-1 rounded-2xl border border-stone-200 flex items-center shadow-2xs">
                  <button
                    onClick={() => setProfileSubSection('profile')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      profileSubSection === 'profile'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile & Settings</span>
                  </button>
                  <button
                    onClick={() => setProfileSubSection('goals')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      profileSubSection === 'goals'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Goals & Milestones</span>
                  </button>
                </div>

                {profileSubSection === 'profile' ? (
                  <ProfileHub
                    onNavigateTab={(t) => setCurrentTab(t)}
                    onOpenJournalEditor={() => setCurrentTab('reflect')}
                    onOpenCompanion={() => setIsCompanionOpen(true)}
                  />
                ) : (
                  <GoalsHub />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      {!isCompanionOpen && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsCompanionOpen(false);
          }}
        />
      )}

      {/* Global Crisis & Helpline Support Modal */}
      <EmergencyModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
