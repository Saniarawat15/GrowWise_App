import React, { useState } from 'react';
import {
  Award,
  Flame,
  Sparkles,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  X,
  Target,
  Mic,
  Calendar,
  Zap,
} from 'lucide-react';
import { Badge, NavigationTab } from '../../types';

interface BadgeSectionProps {
  badges: Badge[];
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenJournalEditor?: () => void;
  onOpenCompanion?: () => void;
}

export const BadgeSection: React.FC<BadgeSectionProps> = ({
  badges,
  onNavigateTab,
  onOpenJournalEditor,
  onOpenCompanion,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length || 12;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100);

  // Filter badges
  const filteredBadges = badges.filter((badge) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'unlocked') return badge.unlocked;
    if (selectedCategory === 'in_progress') return !badge.unlocked;
    return badge.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Icon mapping
  const getBadgeIcon = (iconName: string, unlocked: boolean, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={`${className} ${unlocked ? 'text-orange-500 fill-orange-500' : 'text-stone-400'}`} />;
      case 'Sparkles':
        return <Sparkles className={`${className} ${unlocked ? 'text-amber-500 fill-amber-400' : 'text-stone-400'}`} />;
      case 'MessageSquare':
        return <MessageSquare className={`${className} ${unlocked ? 'text-blue-500' : 'text-stone-400'}`} />;
      case 'BookOpen':
        return <BookOpen className={`${className} ${unlocked ? 'text-emerald-500' : 'text-stone-400'}`} />;
      case 'ShieldCheck':
        return <ShieldCheck className={`${className} ${unlocked ? 'text-purple-500' : 'text-stone-400'}`} />;
      case 'Mic':
        return <Mic className={`${className} ${unlocked ? 'text-teal-500' : 'text-stone-400'}`} />;
      case 'Target':
        return <Target className={`${className} ${unlocked ? 'text-rose-500' : 'text-stone-400'}`} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={`${className} ${unlocked ? 'text-emerald-600' : 'text-stone-400'}`} />;
      case 'Zap':
        return <Zap className={`${className} ${unlocked ? 'text-amber-500 fill-amber-400' : 'text-stone-400'}`} />;
      default:
        return <Award className={`${className} ${unlocked ? 'text-emerald-600' : 'text-stone-400'}`} />;
    }
  };

  // Tier color styling
  const getTierBadge = (tier: string) => {
    const t = (tier || 'Bronze').toLowerCase();
    switch (t) {
      case 'gold':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'Gold Tier',
          glow: 'from-amber-500/20 via-yellow-500/10 to-transparent',
        };
      case 'silver':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          label: 'Silver Tier',
          glow: 'from-slate-400/20 via-stone-300/10 to-transparent',
        };
      case 'special':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          label: 'Special',
          glow: 'from-purple-500/20 via-pink-500/10 to-transparent',
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          label: 'Bronze Tier',
          glow: 'from-amber-600/15 via-orange-400/10 to-transparent',
        };
    }
  };

  const handleActionForBadge = (badge: Badge) => {
    setSelectedBadge(null);
    if (badge.category === 'streak' || badge.id.includes('daily')) {
      onNavigateTab?.('grow');
    } else if (badge.category === 'ai' || badge.id.includes('ai')) {
      onOpenCompanion?.();
    } else if (badge.category === 'journal') {
      onOpenJournalEditor?.();
    } else if (badge.category === 'confidence') {
      onNavigateTab?.('grow');
    } else if (badge.category === 'english') {
      onNavigateTab?.('practice');
    } else if (badge.category === 'goals') {
      onNavigateTab?.('profile');
    }
  };

  return (
    <div id="achievement-badges-section" className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-stone-900">Achievement Badges</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {unlockedCount} / {totalCount} Earned
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Celebrate your consistency, courage, and daily progress.
            </p>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="sm:w-44 w-full">
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold mb-1">
            <span>Progress</span>
            <span className="text-stone-900 font-bold">{unlockPercentage}%</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${unlockPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'all', label: 'All Badges' },
          { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
          { id: 'in_progress', label: `In Progress (${totalCount - unlockedCount})` },
          { id: 'streak', label: 'Streaks' },
          { id: 'confidence', label: 'Confidence' },
          { id: 'journal', label: 'Journaling' },
          { id: 'ai', label: 'AI Mentor' },
          { id: 'english', label: 'Speaking' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              selectedCategory === tab.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredBadges.map((badge) => {
          const tier = getTierBadge(badge.tier);
          const currentProg = badge.progress?.current ?? 0;
          const maxProg = badge.progress?.max ?? 1;
          const percent = Math.min(100, Math.round((currentProg / maxProg) * 100));
          const badgeTitle = badge.name || (badge as any).title || 'Achievement';

          return (
            <div
              key={badge.id}
              id={`badge-card-${badge.id}`}
              onClick={() => setSelectedBadge(badge)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between select-none ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-white via-white to-amber-50/30 border-amber-200 hover:border-amber-400 hover:shadow-md'
                  : 'bg-stone-50/70 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <div>
                {/* Top row: Icon + Tier badge */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-xs'
                        : 'bg-stone-200/70 border-stone-300'
                    }`}
                  >
                    {getBadgeIcon(badge.icon, badge.unlocked)}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${tier.bg}`}>
                      {tier.label}
                    </span>
                    {badge.unlocked ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 text-stone-400" />
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge Title & Description */}
                <h4 className="font-heading text-sm font-bold text-stone-900 leading-tight">
                  {badgeTitle}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed mt-1 line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Bottom Progress Bar */}
              <div className="mt-3.5 pt-2.5 border-t border-stone-100">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-stone-400 font-medium">
                    {badge.unlocked ? (
                      badge.unlocked_at ? (
                        `Earned ${new Date(badge.unlocked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                      ) : (
                        'Completed'
                      )
                    ) : (
                      badge.progress?.label || 'In Progress'
                    )}
                  </span>
                  <span className={`font-semibold ${badge.unlocked ? 'text-emerald-700' : 'text-stone-600'}`}>
                    {currentProg} / {maxProg}
                  </span>
                </div>

                <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      badge.unlocked ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Badge Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs animate-fade-in">
          <div
            id="badge-details-modal"
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-xl relative animate-scale-in"
          >
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3 pt-2">
              <div
                className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center border shadow-md ${
                  selectedBadge.unlocked
                    ? 'bg-gradient-to-br from-amber-100 via-orange-100 to-amber-50 border-amber-300'
                    : 'bg-stone-100 border-stone-300'
                }`}
              >
                {getBadgeIcon(selectedBadge.icon, selectedBadge.unlocked, 'w-8 h-8')}
              </div>

              <div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getTierBadge(selectedBadge.tier).bg}`}>
                  {getTierBadge(selectedBadge.tier).label}
                </span>
                <h3 className="font-heading text-lg font-bold text-stone-900 mt-2">
                  {selectedBadge.name || (selectedBadge as any).title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mt-1">
                  {selectedBadge.description}
                </p>
              </div>

              {/* Progress Detail */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-left space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-600">Completion Status</span>
                  <span className={selectedBadge.unlocked ? 'text-emerald-700' : 'text-stone-700'}>
                    {selectedBadge.progress?.current ?? 0} of {selectedBadge.progress?.max ?? 1} ({Math.min(100, Math.round(((selectedBadge.progress?.current ?? 0) / (selectedBadge.progress?.max ?? 1)) * 100))}%)
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedBadge.unlocked ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round(((selectedBadge.progress?.current ?? 0) / (selectedBadge.progress?.max ?? 1)) * 100))}%`,
                    }}
                  />
                </div>
                {selectedBadge.unlocked && selectedBadge.unlocked_at && (
                  <p className="text-[11px] text-emerald-700 font-medium pt-1">
                    ✓ Achieved on {new Date(selectedBadge.unlocked_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleActionForBadge(selectedBadge)}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {selectedBadge.unlocked
                    ? 'View Activity'
                    : selectedBadge.id.includes('journal')
                    ? 'Go to Journal'
                    : selectedBadge.id.includes('ai')
                    ? 'Chat with AI Mentor'
                    : selectedBadge.id.includes('streak') || selectedBadge.id.includes('confidence')
                    ? 'Open Growth Hub'
                    : 'Take Action'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
