export type NavigationTab = 'home' | 'grow' | 'practice' | 'reflect' | 'profile';

export type MoodType = 'great' | 'good' | 'okay' | 'low' | 'difficult';

export type MentorMode = 'life' | 'study' | 'english' | 'career' | 'motivation' | 'reflect';

export interface MentorModeInfo {
  id: MentorMode;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  iconName: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  pillBg: string;
  starters: string[];
  safeVentFocus: string;
}

export interface User {
  id: string;
  name: string;
  real_name?: string;
  nickname?: string;
  student_id?: string;
  college_name?: string;
  email: string;
  age?: number;
  education_level: string;
  main_growth_goal: string;
  onboarding_completed?: boolean;
  streak_count: number;
}

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface UserGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'Confidence' | 'English' | 'Communication' | 'Career' | 'Study' | 'Personal Growth';
  deadline: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface AIReflection {
  themes: string[];
  emotions: string[];
  patterns: string;
  positiveObservations: string[];
  questionsForReflection: string[];
  generatedAt: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: MoodType;
  ai_reflection?: AIReflection;
  created_at: string;
  updated_at: string;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  activity_type: 'Mind' | 'Communication' | 'Confidence';
  activity_text: string;
  completed: boolean;
  activity_date: string;
  completed_at?: string;
}

export interface ConfidenceActivity {
  id: string;
  user_id: string;
  activity: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  points: number;
  completed: boolean;
  completed_at?: string;
  user_reflection?: string;
}

export interface EnglishProgress {
  id: string;
  user_id: string;
  grammar_score: number;
  vocabulary_score: number;
  fluency_score: number;
  confidence_score: number;
  exercises_completed: number;
  recorded_date: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  message: string;
  action_type?: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at?: string;
  is_vent?: boolean;
  messages: ChatMessage[];
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  mode: string;
  is_vent?: boolean;
  created_at: string;
  updated_at?: string;
  messageCount: number;
  lastMessage?: string;
}

export interface DailyGrowthStreak {
  currentStreak: number;
  bestStreak: number;
  todayCompletedCount: number;
  todayTotal: number;
  isTodayCompleted: boolean;
  status: 'completed_today' | 'pending_today' | 'broken' | 'fresh_start';
  message: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'confidence' | 'journal' | 'ai' | 'english' | 'goals';
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress: {
    current: number;
    max: number;
    label: string;
  };
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Special';
}

export interface UserStats {
  confidencePercent: number;
  englishOverall: number;
  englishBreakdown: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    confidence: number;
    exercisesCompleted: number;
  };
  dailyActivitiesCompleted: number;
  todayDailyGrowth: {
    completed: number;
    total: number;
  };
  journalCount: number;
  reflectionsCount: number;
  activeGoalsCount: number;
  totalGoalsCount: number;
  streakDays: number;
  totalPoints: number;
  dailyGrowthStreak?: DailyGrowthStreak;
  badges?: Badge[];
  englishWeeklyActivity?: EnglishWeeklyActivity;
}

export interface EnglishPracticeSession {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  category: 'speaking' | 'interview' | 'presentation' | 'vocabulary' | 'grammar';
  title?: string;
  notes?: string;
  created_at: string;
}

export interface DayPracticeData {
  day: string; // 'Mon', 'Tue', etc.
  fullDay: string; // 'Monday', etc.
  date: string; // '2026-09-11'
  hours: number;
  minutes: number;
  speakingHours: number;
  interviewHours: number;
  vocabGrammarHours: number;
  targetHours: number;
  isToday: boolean;
}

export interface WeekTrendData {
  week: string;
  hours: number;
  targetHours: number;
  sessionsCount: number;
}

export interface EnglishWeeklyActivity {
  currentWeekDays: DayPracticeData[];
  fourWeekTrend: WeekTrendData[];
  totalHoursThisWeek: number;
  dailyAverageHours: number;
  weeklyTargetHours: number;
  targetCompletionPercent: number;
  bestDay: {
    day: string;
    hours: number;
  };
  totalSessionsCount: number;
  comparedToLastWeekPercent: number;
  recentSessions: EnglishPracticeSession[];
}

export interface EnglishEvaluation {
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  confidenceScore: number;
  yourSentence: string;
  betterVersion: string;
  explanation: string;
  positiveFeedback: string;
  keyTakeaways: string[];
}
