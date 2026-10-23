import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Languages,
  Clock,
  TrendingUp,
  Sparkles,
  Plus,
  CheckCircle2,
  ArrowRight,
  Award,
  Flame,
  Mic,
  Briefcase,
  Layers,
  Calendar,
  X,
} from 'lucide-react';
import { EnglishWeeklyActivity } from '../../types';
import { api } from '../../services/apiClient';

interface EnglishWeeklyActivityGraphProps {
  weeklyActivity?: EnglishWeeklyActivity;
  onRefreshStats: () => void;
  onNavigateToPractice: () => void;
}

export const EnglishWeeklyActivityGraph: React.FC<EnglishWeeklyActivityGraphProps> = ({
  weeklyActivity,
  onRefreshStats,
  onNavigateToPractice,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'trend' | 'breakdown'>('daily');
  const [isLogging, setIsLogging] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMinutes, setLogMinutes] = useState<number>(30);
  const [logCategory, setLogCategory] = useState<'speaking' | 'interview' | 'presentation' | 'vocabulary' | 'grammar'>('speaking');
  const [logTitle, setLogTitle] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fallback data if waiting for initial response
  const defaultDays = [
    { day: 'Mon', fullDay: 'Monday', date: '2026-09-08', hours: 0.8, minutes: 48, speakingHours: 0.5, interviewHours: 0.3, vocabGrammarHours: 0.0, targetHours: 0.8, isToday: false },
    { day: 'Tue', fullDay: 'Tuesday', date: '2026-09-09', hours: 1.1, minutes: 65, speakingHours: 0.3, interviewHours: 0.8, vocabGrammarHours: 0.0, targetHours: 0.8, isToday: false },
    { day: 'Wed', fullDay: 'Wednesday', date: '2026-09-10', hours: 0.7, minutes: 40, speakingHours: 0.3, interviewHours: 0.0, vocabGrammarHours: 0.4, targetHours: 0.8, isToday: false },
    { day: 'Thu', fullDay: 'Thursday', date: '2026-09-11', hours: 1.4, minutes: 85, speakingHours: 0.4, interviewHours: 0.7, vocabGrammarHours: 0.3, targetHours: 0.8, isToday: false },
    { day: 'Fri', fullDay: 'Friday', date: '2026-09-12', hours: 0.9, minutes: 55, speakingHours: 0.6, interviewHours: 0.3, vocabGrammarHours: 0.0, targetHours: 0.8, isToday: true },
    { day: 'Sat', fullDay: 'Saturday', date: '2026-09-13', hours: 0.5, minutes: 30, speakingHours: 0.5, interviewHours: 0.0, vocabGrammarHours: 0.0, targetHours: 0.8, isToday: false },
    { day: 'Sun', fullDay: 'Sunday', date: '2026-09-14', hours: 0.0, minutes: 0, speakingHours: 0.0, interviewHours: 0.0, vocabGrammarHours: 0.0, targetHours: 0.8, isToday: false },
  ];

  const defaultTrend = [
    { week: '3 Wks Ago', hours: 3.2, targetHours: 5.6, sessionsCount: 4 },
    { week: '2 Wks Ago', hours: 4.2, targetHours: 5.6, sessionsCount: 5 },
    { week: 'Last Week', hours: 4.6, targetHours: 5.6, sessionsCount: 6 },
    { week: 'This Week', hours: 5.4, targetHours: 5.6, sessionsCount: 7 },
  ];

  const daysData = weeklyActivity?.currentWeekDays?.length ? weeklyActivity.currentWeekDays : defaultDays;
  const trendData = weeklyActivity?.fourWeekTrend?.length ? weeklyActivity.fourWeekTrend : defaultTrend;

  const totalHours = weeklyActivity?.totalHoursThisWeek ?? 5.4;
  const targetHours = weeklyActivity?.weeklyTargetHours ?? 5.6;
  const completionPercent = weeklyActivity?.targetCompletionPercent ?? Math.min(100, Math.round((totalHours / targetHours) * 100));
  const dailyAverage = weeklyActivity?.dailyAverageHours ?? Math.round((totalHours / 7) * 10) / 10;
  const bestDay = weeklyActivity?.bestDay ?? { day: 'Thu', hours: 1.4 };
  const comparison = weeklyActivity?.comparedToLastWeekPercent ?? 17;

  // Handle Quick Log
  const handleQuickLog = async (minutes: number, category: 'speaking' | 'interview' | 'presentation' | 'vocabulary') => {
    setIsLogging(true);
    try {
      const categoryNames: Record<string, string> = {
        speaking: 'Spoken Fluency',
        interview: 'Placement Interview',
        presentation: '2-Minute Presentation',
        vocabulary: 'Active Vocabulary',
      };
      await api.logEnglishSession({
        minutes,
        category,
        title: `Quick Log: ${categoryNames[category]}`,
      });
      setSuccessToast(`+${minutes}m ${categoryNames[category]} recorded! Graph updated.`);
      onRefreshStats();
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.error('Failed to log session', e);
    } finally {
      setIsLogging(false);
    }
  };

  // Handle Custom Log Form
  const handleCustomLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (logMinutes <= 0) return;
    setIsLogging(true);
    try {
      await api.logEnglishSession({
        minutes: Number(logMinutes),
        category: logCategory,
        title: logTitle.trim() || `${logCategory.charAt(0).toUpperCase() + logCategory.slice(1)} Practice`,
      });
      setShowLogModal(false);
      setLogTitle('');
      setSuccessToast(`+${logMinutes} mins logged! Progress updated.`);
      onRefreshStats();
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      console.error('Failed to log custom session', e);
    } finally {
      setIsLogging(false);
    }
  };

  // Custom Recharts Tooltip
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div id="english-chart-tooltip" className="bg-stone-900 text-white p-3 rounded-2xl shadow-xl border border-stone-700 text-xs min-w-[170px]">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 mb-2">
            <span className="font-bold text-stone-100">{data.fullDay || data.day}</span>
            <span className="text-[10px] text-stone-400">{data.date}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Total Practice:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {data.hours} hrs ({data.minutes}m)
              </span>
            </div>
            {data.speakingHours !== undefined && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Speaking & Spoken:</span>
                <span className="text-teal-300 font-medium">{data.speakingHours}h</span>
              </div>
            )}
            {data.interviewHours !== undefined && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Interview & Defense:</span>
                <span className="text-sky-300 font-medium">{data.interviewHours}h</span>
              </div>
            )}
            {data.vocabGrammarHours !== undefined && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Vocab & Grammar:</span>
                <span className="text-purple-300 font-medium">{data.vocabGrammarHours}h</span>
              </div>
            )}
          </div>
          <div className="mt-2 pt-1.5 border-t border-stone-800 flex items-center justify-between text-[10px]">
            <span className="text-stone-400">Daily Target (0.8h):</span>
            <span className={data.hours >= 0.8 ? 'text-emerald-400 font-bold' : 'text-stone-400'}>
              {data.hours >= 0.8 ? '✓ Goal Achieved' : `${Math.round((0.8 - data.hours) * 10) / 10}h to target`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900 text-white p-3 rounded-2xl shadow-xl border border-stone-700 text-xs min-w-[160px]">
          <div className="font-bold text-stone-100 border-b border-stone-800 pb-1 mb-1.5">
            {data.week}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-400">Practice Time:</span>
            <span className="font-bold text-emerald-400">{data.hours} hrs</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
            <span>Weekly Goal:</span>
            <span>{data.targetHours} hrs</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>Sessions Logged:</span>
            <span className="text-stone-200">{data.sessionsCount} sessions</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="english-weekly-activity-graph"
      className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs relative overflow-hidden"
    >
      {/* Toast notification */}
      {successToast && (
        <div className="absolute top-4 right-4 z-20 bg-stone-900 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <h2 className="font-heading text-lg font-bold text-stone-900">
              Weekly English Practice Activity
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
              Recharts
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Track your spoken confidence, presentation drills & interview prep hours over time
          </p>
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center bg-stone-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            id="chart-mode-daily"
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            id="chart-mode-trend"
            onClick={() => setViewMode('trend')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'trend'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            4-Wk Growth
          </button>
          <button
            type="button"
            id="chart-mode-breakdown"
            onClick={() => setViewMode('breakdown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'breakdown'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Skills Breakdown
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
            <span>Total This Week</span>
            <Clock className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-heading text-stone-900">{totalHours}</span>
            <span className="text-xs font-semibold text-stone-500">hours</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+{comparison}% vs last week</span>
          </div>
        </div>

        <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
            <span>Daily Average</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-heading text-stone-900">{dailyAverage}</span>
            <span className="text-xs font-semibold text-stone-500">hrs/day</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            ~{Math.round(dailyAverage * 60)} mins each day
          </div>
        </div>

        <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
            <span>Weekly Target</span>
            <Award className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-heading text-stone-900">{completionPercent}%</span>
            <span className="text-xs font-semibold text-stone-500">of {targetHours}h</span>
          </div>
          <div className="text-[10px] text-teal-700 font-semibold mt-1">
            {totalHours >= targetHours ? '🎯 Target reached!' : `${Math.round((targetHours - totalHours) * 10) / 10}h left to goal`}
          </div>
        </div>

        <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
            <span>Peak Practice Day</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-heading text-stone-900">{bestDay.day}</span>
            <span className="text-xs font-semibold text-stone-500">({bestDay.hours}h)</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            Highest speaking volume
          </div>
        </div>
      </div>

      {/* Chart Canvas Render */}
      <div className="w-full h-64 sm:h-72 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'trend' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
              <XAxis
                dataKey="week"
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
              />
              <YAxis
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit="h"
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <ReferenceLine
                y={5.6}
                stroke="#059669"
                strokeDasharray="4 4"
                label={{ value: 'Target 5.6h', fill: '#059669', fontSize: 10, position: 'insideTopRight' }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          ) : viewMode === 'breakdown' ? (
            <BarChart data={daysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
              />
              <YAxis
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit="h"
                domain={[0, 2]}
              />
              <Tooltip content={<CustomDailyTooltip />} />
              <ReferenceLine
                y={0.8}
                stroke="#059669"
                strokeDasharray="4 4"
                label={{ value: 'Goal 0.8h', fill: '#059669', fontSize: 10, position: 'insideTopRight' }}
              />
              <Bar dataKey="speakingHours" name="Speaking" stackId="a" fill="#0d9488" />
              <Bar dataKey="interviewHours" name="Interview" stackId="a" fill="#0284c7" />
              <Bar dataKey="vocabGrammarHours" name="Vocab & Grammar" stackId="a" fill="#9333ea" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart data={daysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="primaryBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>
                <linearGradient id="todayBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
              />
              <YAxis
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit="h"
                domain={[0, 2]}
              />
              <Tooltip content={<CustomDailyTooltip />} />
              <ReferenceLine
                y={0.8}
                stroke="#059669"
                strokeDasharray="4 4"
                label={{ value: 'Daily Goal 0.8h', fill: '#059669', fontSize: 10, position: 'insideTopRight' }}
              />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {daysData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? 'url(#todayBarGradient)' : 'url(#primaryBarGradient)'}
                    stroke={entry.isToday ? '#059669' : 'transparent'}
                    strokeWidth={entry.isToday ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Legend & Context info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
        <div className="flex items-center gap-4">
          {viewMode === 'breakdown' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span>Speaking Drills</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                <span>Interview STAR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Vocab & Grammar</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span>Practice Hours Logged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-b-2 border-dashed border-emerald-600" />
                <span>Daily Target (0.8h / 48m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Today's Bar</span>
              </div>
            </>
          )}
        </div>

        <div className="text-[11px] text-stone-400">
          Non-guilt tracking • Every minute of speaking builds confidence
        </div>
      </div>

      {/* Interactive Quick Logging Action Bar */}
      <div className="mt-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-700">Quick Log:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isLogging}
              onClick={() => handleQuickLog(15, 'speaking')}
              className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-stone-200 hover:border-teal-300 rounded-lg text-xs font-medium text-stone-700 hover:text-teal-800 transition-all flex items-center gap-1"
            >
              <Mic className="w-3 h-3 text-teal-600" />
              <span>+15m Speaking</span>
            </button>
            <button
              type="button"
              disabled={isLogging}
              onClick={() => handleQuickLog(30, 'interview')}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-stone-200 hover:border-sky-300 rounded-lg text-xs font-medium text-stone-700 hover:text-sky-800 transition-all flex items-center gap-1"
            >
              <Briefcase className="w-3 h-3 text-sky-600" />
              <span>+30m Interview</span>
            </button>
            <button
              type="button"
              disabled={isLogging}
              onClick={() => handleQuickLog(20, 'presentation')}
              className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-lg text-xs font-medium text-stone-700 hover:text-amber-800 transition-all flex items-center gap-1"
            >
              <Layers className="w-3 h-3 text-amber-600" />
              <span>+20m Presentation</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLogModal(true)}
              className="px-2.5 py-1 bg-stone-200/70 hover:bg-stone-200 rounded-lg text-xs font-medium text-stone-700 transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Custom...</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToPractice}
          className="self-end md:self-auto px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>Open English Practice Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal for Custom Log Session */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-stone-900">
                  Log English Practice Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomLogSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Practice Duration (Minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Number(e.target.value))}
                    className="flex-1 accent-teal-600 cursor-pointer"
                  />
                  <span className="w-16 text-center font-mono font-bold text-sm text-teal-800 bg-teal-50 py-1 rounded-lg border border-teal-200">
                    {logMinutes}m
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                  <span>5m</span>
                  <span>45m</span>
                  <span>90m</span>
                  <span>180m</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Practice Category
                </label>
                <select
                  value={logCategory}
                  onChange={(e: any) => setLogCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-hidden focus:border-teal-500"
                >
                  <option value="speaking">Spoken English & Fluency</option>
                  <option value="interview">Campus Placement & Technical Interview</option>
                  <option value="presentation">2-Minute Presentation & Pitching</option>
                  <option value="vocabulary">Active Vocabulary Building</option>
                  <option value="grammar">Grammar Polish & Tense Precision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Topic / Activity Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., STAR Method Answering, GD Practice..."
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLogging}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save to Graph</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
