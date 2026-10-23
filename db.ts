import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  real_name?: string;
  nickname?: string;
  student_id?: string;
  college_name?: string;
  email: string;
  password_hash: string;
  salt: string;
  age?: number;
  education_level: string;
  main_growth_goal: string;
  onboarding_completed?: boolean;
  streak_count: number;
  last_active_date: string;
  created_at: string;
  updated_at: string;
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
  mood: 'great' | 'good' | 'okay' | 'low' | 'difficult';
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

interface DatabaseSchema {
  users: User[];
  user_goals: UserGoal[];
  journal_entries: JournalEntry[];
  daily_activities: DailyActivity[];
  confidence_activities: ConfidenceActivity[];
  english_progress: EnglishProgress[];
  english_practice_sessions?: EnglishPracticeSession[];
  chat_sessions: ChatSession[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'growwise-db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    user_goals: [],
    journal_entries: [],
    daily_activities: [],
    confidence_activities: [],
    english_progress: [],
    english_practice_sessions: [],
    chat_sessions: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.english_practice_sessions) {
          this.data.english_practice_sessions = [];
        }
        this.ensureDemoStreakData();
        this.ensureDemoEnglishPracticeData();
        this.sanitizeHistoricalErrorMessages();
        if (this.data.users) {
          for (const u of this.data.users) {
            if (!u.nickname) u.nickname = u.name.split(' ')[0] || 'Friend';
            if (!u.real_name) u.real_name = u.name;
            if (u.student_id === 'GW-2024-819') u.student_id = '';
            if (u.college_name === 'Apex Institute of Technology') u.college_name = '';
            if (u.onboarding_completed === undefined) u.onboarding_completed = true;
          }
          this.save();
        }
      } else {
        this.seedDemoData();
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database file:', err);
      this.seedDemoData();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public seedDemoData() {
    const demoSalt = crypto.randomBytes(16).toString('hex');
    const demoHash = hashPassword('demo123', demoSalt);
    const today = getTodayStr();

    const demoUser: User = {
      id: 'demo-user-alex',
      name: 'Alex Chen',
      real_name: 'Alexander Chen',
      nickname: 'Alex',
      student_id: '',
      college_name: '',
      email: 'alex@growwise.edu',
      password_hash: demoHash,
      salt: demoSalt,
      age: 20,
      education_level: 'Undergraduate (3rd Year)',
      main_growth_goal: 'Speak English more confidently & conquer presentation anxiety',
      onboarding_completed: true,
      streak_count: 5,
      last_active_date: today,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoGoals: UserGoal[] = [
      {
        id: 'goal-1',
        user_id: demoUser.id,
        title: 'Become more confident during presentations',
        description: 'Overcome anxiety when speaking in front of the class for the final semester capstone presentation.',
        category: 'Confidence',
        deadline: '2026-10-15',
        progress: 75,
        status: 'active',
        milestones: [
          { id: 'm-1', text: 'Practice presentation alone in room', completed: true },
          { id: 'm-2', text: 'Record myself on video and review body language', completed: true },
          { id: 'm-3', text: 'Present slides to a close friend for feedback', completed: true },
          { id: 'm-4', text: 'Deliver full presentation confidently in seminar', completed: false },
        ],
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'goal-2',
        user_id: demoUser.id,
        title: 'Master Campus Placement & Interview English',
        description: 'Formulate concise, structured answers (STAR method) to behavioral questions without stumbling on vocabulary.',
        category: 'English',
        deadline: '2026-11-01',
        progress: 50,
        status: 'active',
        milestones: [
          { id: 'm-5', text: 'Craft a 90-second "Tell me about yourself" elevator pitch', completed: true },
          { id: 'm-6', text: 'Practice 10 situational interview prompts with GrowWise AI', completed: true },
          { id: 'm-7', text: 'Conduct a peer mock interview with a classmate', completed: false },
          { id: 'm-8', text: 'Finalize resume discussion points and technical project summaries', completed: false },
        ],
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'goal-3',
        user_id: demoUser.id,
        title: 'Active classroom engagement',
        description: 'Raise hand and ask at least one relevant question in every lecture this month.',
        category: 'Communication',
        deadline: '2026-10-30',
        progress: 33,
        status: 'active',
        milestones: [
          { id: 'm-9', text: 'Note down questions in advance during reading', completed: true },
          { id: 'm-10', text: 'Ask professor a question during office hours', completed: false },
          { id: 'm-11', text: 'Speak up in a 40-student classroom discussion', completed: false },
        ],
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const demoJournals: JournalEntry[] = [
      {
        id: 'journal-1',
        user_id: demoUser.id,
        title: 'Overcoming the fear of speaking in seminar',
        content: 'Today Professor Miller asked for volunteers to discuss our literature review. Usually my heart races and my palms sweat whenever I think about raising my hand. But today I remembered the advice: focus on sharing one helpful point rather than trying to look impressive. I raised my hand and spoke for 45 seconds. My voice trembled a bit at the start, but nobody judged me. In fact, a classmate nodded along. Feeling proud of this small step.',
        mood: 'great',
        ai_reflection: {
          themes: ['Courage in public speaking', 'Reframing mindset from performance to sharing', 'Progress over perfection'],
          emotions: ['Initial nervousness', 'Relief', 'Quiet pride and validation'],
          patterns: 'Notice how shifting your intention from "impressing everyone" to "sharing one point" immediately reduced your internal resistance.',
          positiveObservations: [
            'You took concrete action despite physical sensations of fear (heart racing).',
            'You recognized that people were attentive rather than critical.',
          ],
          questionsForReflection: [
            'What is one phrase or cue you can remind yourself of next time you feel that physical hesitation before speaking?',
          ],
          generatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'journal-2',
        user_id: demoUser.id,
        title: 'Midterm week fatigue & finding steady footing',
        content: 'Felt quite overwhelmed this afternoon balancing three engineering assignments with group discussion prep. I caught myself comparing my progress with others who seem to finish their reports effortlessly. Had a short walk around the campus pond, called my older sister for 10 minutes, and mapped out a realistic schedule. Reminding myself that my timeline is my own.',
        mood: 'good',
        ai_reflection: {
          themes: ['Comparison traps', 'Healthy social support', 'Resetting boundaries'],
          emotions: ['Overwhelm', 'Vulnerability', 'Reassurance'],
          patterns: 'Stepping outside and reaching out to a trusted family member helped interrupt your spiral of self-comparison.',
          positiveObservations: [
            'You actively chose healthy real-world support rather than isolating yourself.',
            'You turned vague anxiety into an actionable schedule.',
          ],
          questionsForReflection: [
            'How can you celebrate the work you finished today rather than fixating on what remains for tomorrow?',
          ],
          generatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'journal-3',
        user_id: demoUser.id,
        title: 'English conversation club notes',
        content: 'Attended the campus English conversation circle today. I paused a few times looking for the word "pragmatic" and used "practical" instead. The facilitator smiled and said that was totally clear. It made me realize good communication is about connection, not having a dictionary in your head.',
        mood: 'great',
        ai_reflection: {
          themes: ['Language fluency vs communication', 'Self-acceptance', 'Social ease'],
          emotions: ['Curiosity', 'Confidence', 'Belonging'],
          patterns: 'You are beginning to treat conversational pauses as natural rather than as personal failures.',
          positiveObservations: [
            'Adapting your vocabulary on the fly demonstrates real conversational agility.',
            'You left the session energized rather than self-critical.',
          ],
          questionsForReflection: [
            'Which topic would you feel excited to discuss at the next meeting?',
          ],
          generatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
        created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        id: 'journal-4',
        user_id: demoUser.id,
        title: 'Giving constructive feedback to my lab partner',
        content: 'I had to point out an inconsistency in our experimental data. In the past I would have stayed quiet to avoid awkwardness. Today I said: "I want to make sure our submission is solid. Look at row 18." He appreciated it immediately and thanked me.',
        mood: 'great',
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'journal-5',
        user_id: demoUser.id,
        title: 'Imposter feelings during career fair prep',
        content: 'Looking at other students resumes on LinkedIn made me feel inadequate. Grounded myself by listing 3 real projects I built from scratch with my own hands. I do not need to be ahead of everyone; I only need to be proud of my own craftsmanship.',
        mood: 'okay',
        created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'journal-6',
        user_id: demoUser.id,
        title: 'Ten-minute campus morning stroll',
        content: 'Left my phone in my backpack and walked by the university gardens before my 9 AM lecture. Noticed how crisp the autumn air felt. My mind felt significantly clearer and less cluttered for the rest of the morning.',
        mood: 'good',
        created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
      {
        id: 'journal-7',
        user_id: demoUser.id,
        title: 'Receiving a B-minus on my midterm report',
        content: 'At first I felt an instant flash of disappointment. Then I reviewed the grader notes carefully. The logic was sound; only the formatting and citations needed tightening. Scheduled office hours next Tuesday to clarify.',
        mood: 'okay',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'journal-8',
        user_id: demoUser.id,
        title: 'Mock interview with campus career advisor',
        content: 'Practiced answering "Tell me about yourself" without rambling. Advisor recommended using the Present-Past-Future framework. Felt 10x more organized by the second take.',
        mood: 'great',
        created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 11 * 86400000).toISOString(),
      },
      {
        id: 'journal-9',
        user_id: demoUser.id,
        title: 'Active listening during group project meeting',
        content: 'Intentionally paused before speaking today to really digest what Sarah was proposing. Building on someone else idea felt much more collaborative than competing to be the loudest voice in the room.',
        mood: 'good',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
    ];

    // Seed previous 4 consecutive completed days for demo user, plus today with 2 of 3 completed
    const demoDaily: DailyActivity[] = [
      // Day - 4
      {
        id: `daily-mind-${demoUser.id}-${new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Mind',
        activity_text: 'Write down what felt draining vs. what gave you quiet energy today.',
        completed: true,
        activity_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 4 * 86400000 + 3600000).toISOString(),
      },
      {
        id: `daily-comm-${demoUser.id}-${new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Communication',
        activity_text: 'Explain a technical concept simply as if to a middle school student.',
        completed: true,
        activity_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 4 * 86400000 + 7200000).toISOString(),
      },
      {
        id: `daily-conf-${demoUser.id}-${new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Confidence',
        activity_text: 'Introduce yourself by name with a firm, calm voice to a peer.',
        completed: true,
        activity_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 4 * 86400000 + 10800000).toISOString(),
      },

      // Day - 3
      {
        id: `daily-mind-${demoUser.id}-${new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Mind',
        activity_text: 'Recall a small win you almost dismissed without celebrating.',
        completed: true,
        activity_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString(),
      },
      {
        id: `daily-comm-${demoUser.id}-${new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Communication',
        activity_text: 'Express sincere appreciation to someone who helped you this week.',
        completed: true,
        activity_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 3 * 86400000 + 7200000).toISOString(),
      },
      {
        id: `daily-conf-${demoUser.id}-${new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Confidence',
        activity_text: 'Send an email asking for advice without apologizing for asking.',
        completed: true,
        activity_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 3 * 86400000 + 10800000).toISOString(),
      },

      // Day - 2
      {
        id: `daily-mind-${demoUser.id}-${new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Mind',
        activity_text: 'Identify a moment today when you chose patience over frustration.',
        completed: true,
        activity_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
      },
      {
        id: `daily-comm-${demoUser.id}-${new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Communication',
        activity_text: 'Practice pausing for 2 seconds before answering a question.',
        completed: true,
        activity_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 2 * 86400000 + 7200000).toISOString(),
      },
      {
        id: `daily-conf-${demoUser.id}-${new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Confidence',
        activity_text: 'Walk with shoulders relaxed and eyes forward across campus plaza.',
        completed: true,
        activity_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 2 * 86400000 + 10800000).toISOString(),
      },

      // Day - 1 (Yesterday)
      {
        id: `daily-mind-${demoUser.id}-${new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Mind',
        activity_text: 'Acknowledge one personal boundary you maintained today.',
        completed: true,
        activity_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 1 * 86400000 + 3600000).toISOString(),
      },
      {
        id: `daily-comm-${demoUser.id}-${new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Communication',
        activity_text: 'Summarize an interesting article or video out loud in 60 seconds.',
        completed: true,
        activity_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 1 * 86400000 + 7200000).toISOString(),
      },
      {
        id: `daily-conf-${demoUser.id}-${new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0]}`,
        user_id: demoUser.id,
        activity_type: 'Confidence',
        activity_text: 'Sit in the front two rows of a lecture or seminar.',
        completed: true,
        activity_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        completed_at: new Date(Date.now() - 1 * 86400000 + 10800000).toISOString(),
      },

      // Today (2 of 3 completed, 3rd pending)
      {
        id: `daily-mind-${today}`,
        user_id: demoUser.id,
        activity_type: 'Mind',
        activity_text: 'Write one thing you learned about how you handle pressure this week.',
        completed: true,
        activity_date: today,
        completed_at: new Date().toISOString(),
      },
      {
        id: `daily-comm-${today}`,
        user_id: demoUser.id,
        activity_type: 'Communication',
        activity_text: 'Speak for one minute without stopping about a hobby or book you enjoy.',
        completed: true,
        activity_date: today,
        completed_at: new Date().toISOString(),
      },
      {
        id: `daily-conf-${today}`,
        user_id: demoUser.id,
        activity_type: 'Confidence',
        activity_text: 'Greet someone you normally walk past in silence (e.g. a campus librarian or classmate).',
        completed: false,
        activity_date: today,
      },
    ];

    const demoConfidenceActivities: ConfidenceActivity[] = [
      // Beginner
      {
        id: 'conf-b-1',
        user_id: demoUser.id,
        activity: 'Introduce yourself out loud for 30 seconds clearly',
        difficulty: 'Beginner',
        category: 'Speaking',
        points: 10,
        completed: true,
        completed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        user_reflection: 'Timed myself on my phone. First try was rushed; second try felt composed.',
      },
      {
        id: 'conf-b-2',
        user_id: demoUser.id,
        activity: 'Ask one clarifying question in class or lecture',
        difficulty: 'Beginner',
        category: 'Classroom',
        points: 15,
        completed: true,
        completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        user_reflection: 'Asked about slide 14. Professor appreciated the question.',
      },
      {
        id: 'conf-b-3',
        user_id: demoUser.id,
        activity: 'Maintain friendly eye contact during a brief greeting',
        difficulty: 'Beginner',
        category: 'Presence',
        points: 10,
        completed: true,
        completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'conf-b-4',
        user_id: demoUser.id,
        activity: 'Speak one full sentence in English to a peer or instructor',
        difficulty: 'Beginner',
        category: 'Language',
        points: 10,
        completed: true,
        completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },

      // Intermediate
      {
        id: 'conf-i-1',
        user_id: demoUser.id,
        activity: 'Speak for 2 minutes continuously about your favorite project',
        difficulty: 'Intermediate',
        category: 'Speaking',
        points: 25,
        completed: true,
        completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        user_reflection: 'Used the STAR technique. Structured my points into beginning, middle, and results.',
      },
      {
        id: 'conf-i-2',
        user_id: demoUser.id,
        activity: 'Give a 3-minute mini presentation to a friend or study group',
        difficulty: 'Intermediate',
        category: 'Presentation',
        points: 30,
        completed: false,
      },
      {
        id: 'conf-i-3',
        user_id: demoUser.id,
        activity: 'Start a casual conversation with a new classmate before lecture',
        difficulty: 'Intermediate',
        category: 'Social',
        points: 20,
        completed: true,
        completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'conf-i-4',
        user_id: demoUser.id,
        activity: 'Express a polite dissenting opinion in a group discussion',
        difficulty: 'Intermediate',
        category: 'Communication',
        points: 25,
        completed: false,
      },

      // Advanced
      {
        id: 'conf-a-1',
        user_id: demoUser.id,
        activity: 'Complete a full mock behavioral interview session',
        difficulty: 'Advanced',
        category: 'Interview',
        points: 50,
        completed: false,
      },
      {
        id: 'conf-a-2',
        user_id: demoUser.id,
        activity: 'Lead a 5-minute topic opening in a group discussion (GD)',
        difficulty: 'Advanced',
        category: 'Leadership',
        points: 45,
        completed: false,
      },
      {
        id: 'conf-a-3',
        user_id: demoUser.id,
        activity: 'Deliver a presentation to a seminar or audience with Q&A',
        difficulty: 'Advanced',
        category: 'Presentation',
        points: 50,
        completed: false,
      },
      {
        id: 'conf-a-4',
        user_id: demoUser.id,
        activity: 'Participate actively in a structured debate or panel',
        difficulty: 'Advanced',
        category: 'Public Speaking',
        points: 40,
        completed: false,
      },
    ];

    const demoEnglishProgress: EnglishProgress[] = [
      {
        id: 'eng-1',
        user_id: demoUser.id,
        grammar_score: 74,
        vocabulary_score: 70,
        fluency_score: 65,
        confidence_score: 72,
        exercises_completed: 14,
        recorded_date: today,
      },
    ];

    const demoChatSession: ChatSession = {
      id: 'session-demo',
      user_id: demoUser.id,
      title: 'Confidence & Communication Coaching',
      mode: 'general',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      messages: [
        {
          id: 'msg-1',
          session_id: 'session-demo',
          sender: 'assistant',
          message: "Welcome to GrowWise, Alex 🌱 I'm your growth companion and communication coach. What's on your mind today — would you like to reflect on a situation, practice your presentation delivery, or tackle a confidence challenge?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          session_id: 'session-demo',
          sender: 'user',
          message: "I have to introduce our group project in front of 30 students tomorrow. I keep worrying that I'll forget what to say and pause awkwardly.",
          timestamp: new Date(Date.now() - 3400000).toISOString(),
        },
        {
          id: 'msg-3',
          session_id: 'session-demo',
          sender: 'assistant',
          message: "It is completely normal to feel that rush of adrenaline before presenting. Let's look at this using our four-step anchor:\n\n**1. Situation:** You are opening your team's project presentation tomorrow.\n**2. Thought:** 'If I pause, everyone will judge me.'\n**3. Reality:** Audiences actually perceive short 2-3 second pauses as thoughtful and confident, not broken. No one expects a recitation robot.\n**4. Action:** Let's practice your opening 3 sentences right now. What is the single main question your project solves?",
          action_type: 'confidence',
          timestamp: new Date(Date.now() - 3200000).toISOString(),
        },
      ],
    };

    this.data = {
      users: [demoUser],
      user_goals: demoGoals,
      journal_entries: demoJournals,
      daily_activities: demoDaily,
      confidence_activities: demoConfidenceActivities,
      english_progress: demoEnglishProgress,
      chat_sessions: [demoChatSession],
    };

    this.save();
  }

  // --- User Operations ---
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(userData: {
    name: string;
    email: string;
    password: string;
    real_name?: string;
    nickname?: string;
    student_id?: string;
    college_name?: string;
    age?: number;
    education_level?: string;
    main_growth_goal?: string;
    onboarding_completed?: boolean;
  }): User {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const password_hash = hashPassword(userData.password, salt);
    const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const today = getTodayStr();

    const rawName = userData.name.trim();
    const realName = (userData.real_name || rawName).trim();
    const nickname = (userData.nickname || rawName.split(' ')[0] || 'Friend').trim();
    const studentId = (userData.student_id || `GW-${Math.floor(1000 + Math.random() * 9000)}`).trim();
    const collegeName = (userData.college_name || 'State University / College').trim();

    const user: User = {
      id,
      name: rawName,
      real_name: realName,
      nickname,
      student_id: studentId,
      college_name: collegeName,
      email: userData.email.trim().toLowerCase(),
      password_hash,
      salt,
      age: userData.age,
      education_level: userData.education_level || 'College Student',
      main_growth_goal: userData.main_growth_goal || 'Improve confidence & communication',
      onboarding_completed: userData.onboarding_completed ?? true,
      streak_count: 1,
      last_active_date: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.users.push(user);
    this.initDefaultUserData(user.id);
    this.save();
    return user;
  }

  public verifyPassword(user: User, passwordAttempt: string): boolean {
    const hashAttempt = hashPassword(passwordAttempt, user.salt);
    return crypto.timingSafeEqual(Buffer.from(user.password_hash, 'hex'), Buffer.from(hashAttempt, 'hex'));
  }

  public updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'real_name' | 'nickname' | 'student_id' | 'college_name' | 'age' | 'education_level' | 'main_growth_goal' | 'onboarding_completed'>>
  ): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found.');

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.real_name !== undefined) user.real_name = updates.real_name.trim();
    if (updates.nickname !== undefined) user.nickname = updates.nickname.trim();
    if (updates.student_id !== undefined) user.student_id = updates.student_id.trim();
    if (updates.college_name !== undefined) user.college_name = updates.college_name.trim();
    if (updates.age !== undefined) user.age = updates.age;
    if (updates.education_level !== undefined) user.education_level = updates.education_level;
    if (updates.main_growth_goal !== undefined) user.main_growth_goal = updates.main_growth_goal;
    if (updates.onboarding_completed !== undefined) user.onboarding_completed = updates.onboarding_completed;
    user.updated_at = new Date().toISOString();

    this.save();
    return user;
  }

  public changePassword(userId: string, oldPass: string, newPass: string): void {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found.');
    if (!this.verifyPassword(user, oldPass)) {
      throw new Error('Current password is incorrect.');
    }
    const newSalt = crypto.randomBytes(16).toString('hex');
    user.salt = newSalt;
    user.password_hash = hashPassword(newPass, newSalt);
    user.updated_at = new Date().toISOString();
    this.save();
  }

  public resetPassword(email: string, newPass: string): void {
    const user = this.getUserByEmail(email);
    if (!user) throw new Error('Account not found with this email.');
    const newSalt = crypto.randomBytes(16).toString('hex');
    user.salt = newSalt;
    user.password_hash = hashPassword(newPass, newSalt);
    user.updated_at = new Date().toISOString();
    this.save();
  }

  public touchUserActivity(userId: string): void {
    const user = this.getUserById(userId);
    if (!user) return;
    const today = getTodayStr();
    if (user.last_active_date !== today) {
      const lastDate = new Date(user.last_active_date);
      const currDate = new Date(today);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        user.streak_count += 1;
      } else if (diffDays > 1) {
        user.streak_count = 1; // Restart gently without punishment
      }
      user.last_active_date = today;
      this.save();
    }
  }

  // --- Seed default activities for new user ---
  private initDefaultUserData(userId: string) {
    const today = getTodayStr();

    // Default daily activities
    const daily: DailyActivity[] = [
      {
        id: `daily-mind-${userId}-${today}`,
        user_id: userId,
        activity_type: 'Mind',
        activity_text: 'Write down one small thing you appreciated about yourself today.',
        completed: false,
        activity_date: today,
      },
      {
        id: `daily-comm-${userId}-${today}`,
        user_id: userId,
        activity_type: 'Communication',
        activity_text: 'Speak for one minute without stopping about your favorite subject or hobby.',
        completed: false,
        activity_date: today,
      },
      {
        id: `daily-conf-${userId}-${today}`,
        user_id: userId,
        activity_type: 'Confidence',
        activity_text: 'Do one small thing today that you normally hesitate to do (e.g. smile or ask a question).',
        completed: false,
        activity_date: today,
      },
    ];

    // Default confidence ladder
    const confs: ConfidenceActivity[] = [
      { id: `c-b1-${userId}`, user_id: userId, activity: 'Introduce yourself out loud for 30 seconds', difficulty: 'Beginner', category: 'Speaking', points: 10, completed: false },
      { id: `c-b2-${userId}`, user_id: userId, activity: 'Ask one question in class or meeting', difficulty: 'Beginner', category: 'Classroom', points: 15, completed: false },
      { id: `c-b3-${userId}`, user_id: userId, activity: 'Maintain eye contact during greeting', difficulty: 'Beginner', category: 'Presence', points: 10, completed: false },
      { id: `c-b4-${userId}`, user_id: userId, activity: 'Speak one sentence in English out loud', difficulty: 'Beginner', category: 'Language', points: 10, completed: false },

      { id: `c-i1-${userId}`, user_id: userId, activity: 'Speak for 2 minutes on a topic you care about', difficulty: 'Intermediate', category: 'Speaking', points: 25, completed: false },
      { id: `c-i2-${userId}`, user_id: userId, activity: 'Give a mini presentation to a peer', difficulty: 'Intermediate', category: 'Presentation', points: 30, completed: false },
      { id: `c-i3-${userId}`, user_id: userId, activity: 'Start a conversation with a new classmate', difficulty: 'Intermediate', category: 'Social', points: 20, completed: false },
      { id: `c-i4-${userId}`, user_id: userId, activity: 'Express an opinion respectfully in a group', difficulty: 'Intermediate', category: 'Communication', points: 25, completed: false },

      { id: `c-a1-${userId}`, user_id: userId, activity: 'Complete a full mock interview challenge', difficulty: 'Advanced', category: 'Interview', points: 50, completed: false },
      { id: `c-a2-${userId}`, user_id: userId, activity: 'Participate actively in a Group Discussion (GD)', difficulty: 'Advanced', category: 'Discussion', points: 45, completed: false },
      { id: `c-a3-${userId}`, user_id: userId, activity: 'Present to a larger audience with live Q&A', difficulty: 'Advanced', category: 'Public Speaking', points: 50, completed: false },
      { id: `c-a4-${userId}`, user_id: userId, activity: 'Structured debate or panel discussion', difficulty: 'Advanced', category: 'Debate', points: 40, completed: false },
    ];

    const initialEng: EnglishProgress = {
      id: `eng-${userId}`,
      user_id: userId,
      grammar_score: 65,
      vocabulary_score: 60,
      fluency_score: 55,
      confidence_score: 60,
      exercises_completed: 0,
      recorded_date: today,
    };

    const initialChat: ChatSession = {
      id: `session-${userId}`,
      user_id: userId,
      title: 'Growth Coaching Session',
      mode: 'general',
      created_at: new Date().toISOString(),
      messages: [
        {
          id: `msg-welcome-${userId}`,
          session_id: `session-${userId}`,
          sender: 'assistant',
          message: "Welcome to GrowWise 🌱 I'm here as your personal growth and communication coach. Whether you want to reflect on a difficult moment, practice speaking English, prepare for an interview, or build daily confidence, I'm ready to help you take that next step.",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    this.data.daily_activities.push(...daily);
    this.data.confidence_activities.push(...confs);
    this.data.english_progress.push(initialEng);
    this.data.chat_sessions.push(initialChat);
  }

  // --- Goals Operations ---
  public getGoals(userId: string): UserGoal[] {
    return this.data.user_goals.filter(g => g.user_id === userId);
  }

  public getGoalById(userId: string, goalId: string): UserGoal | undefined {
    return this.data.user_goals.find(g => g.id === goalId && g.user_id === userId);
  }

  public createGoal(userId: string, data: {
    title: string;
    description: string;
    category: UserGoal['category'];
    deadline: string;
    milestones: string[];
  }): UserGoal {
    const id = `goal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const milestones: Milestone[] = data.milestones.map((m, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      text: m.trim(),
      completed: false,
    }));

    const newGoal: UserGoal = {
      id,
      user_id: userId,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      deadline: data.deadline,
      progress: 0,
      status: 'active',
      milestones,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.user_goals.unshift(newGoal);
    this.save();
    return newGoal;
  }

  public updateGoal(userId: string, goalId: string, updates: Partial<{
    title: string;
    description: string;
    category: UserGoal['category'];
    deadline: string;
    status: UserGoal['status'];
    milestones: Milestone[];
  }>): UserGoal {
    const goal = this.getGoalById(userId, goalId);
    if (!goal) throw new Error('Goal not found.');

    if (updates.title !== undefined) goal.title = updates.title.trim();
    if (updates.description !== undefined) goal.description = updates.description.trim();
    if (updates.category !== undefined) goal.category = updates.category;
    if (updates.deadline !== undefined) goal.deadline = updates.deadline;
    if (updates.status !== undefined) goal.status = updates.status;

    if (updates.milestones !== undefined) {
      goal.milestones = updates.milestones;
      const total = goal.milestones.length;
      const completed = goal.milestones.filter(m => m.completed).length;
      goal.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      if (goal.progress === 100) {
        goal.status = 'completed';
      } else if (goal.status === 'completed' && goal.progress < 100) {
        goal.status = 'active';
      }
    }

    goal.updated_at = new Date().toISOString();
    this.save();
    return goal;
  }

  public deleteGoal(userId: string, goalId: string): void {
    const idx = this.data.user_goals.findIndex(g => g.id === goalId && g.user_id === userId);
    if (idx !== -1) {
      this.data.user_goals.splice(idx, 1);
      this.save();
    }
  }

  // --- Journal Operations ---
  public getJournalEntries(userId: string, options?: { search?: string; mood?: string }): JournalEntry[] {
    let entries = this.data.journal_entries.filter(j => j.user_id === userId);

    if (options?.mood) {
      entries = entries.filter(j => j.mood === options.mood);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      entries = entries.filter(j => j.title.toLowerCase().includes(q) || j.content.toLowerCase().includes(q));
    }

    return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getJournalEntryById(userId: string, id: string): JournalEntry | undefined {
    return this.data.journal_entries.find(j => j.id === id && j.user_id === userId);
  }

  public createJournalEntry(userId: string, data: {
    title: string;
    content: string;
    mood: JournalEntry['mood'];
  }): JournalEntry {
    const entry: JournalEntry = {
      id: `journal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      user_id: userId,
      title: data.title.trim(),
      content: data.content.trim(),
      mood: data.mood,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.journal_entries.unshift(entry);
    this.touchUserActivity(userId);
    this.save();
    return entry;
  }

  public updateJournalEntry(userId: string, id: string, updates: {
    title?: string;
    content?: string;
    mood?: JournalEntry['mood'];
    ai_reflection?: AIReflection;
  }): JournalEntry {
    const entry = this.getJournalEntryById(userId, id);
    if (!entry) throw new Error('Journal entry not found.');

    if (updates.title !== undefined) entry.title = updates.title.trim();
    if (updates.content !== undefined) entry.content = updates.content.trim();
    if (updates.mood !== undefined) entry.mood = updates.mood;
    if (updates.ai_reflection !== undefined) entry.ai_reflection = updates.ai_reflection;

    entry.updated_at = new Date().toISOString();
    this.save();
    return entry;
  }

  public deleteJournalEntry(userId: string, id: string): void {
    const idx = this.data.journal_entries.findIndex(j => j.id === id && j.user_id === userId);
    if (idx !== -1) {
      this.data.journal_entries.splice(idx, 1);
      this.save();
    }
  }

  // --- Daily Growth Operations ---
  public getDailyActivities(userId: string, dateStr?: string): DailyActivity[] {
    const targetDate = dateStr || getTodayStr();
    let activities = this.data.daily_activities.filter(a => a.user_id === userId && a.activity_date === targetDate);

    if (activities.length === 0) {
      // Generate daily 3 for today
      activities = [
        {
          id: `daily-mind-${userId}-${targetDate}`,
          user_id: userId,
          activity_type: 'Mind',
          activity_text: 'Write one thing you learned about how you respond to uncertainty.',
          completed: false,
          activity_date: targetDate,
        },
        {
          id: `daily-comm-${userId}-${targetDate}`,
          user_id: userId,
          activity_type: 'Communication',
          activity_text: 'Speak for one minute without pausing about a personal interest or project.',
          completed: false,
          activity_date: targetDate,
        },
        {
          id: `daily-conf-${userId}-${targetDate}`,
          user_id: userId,
          activity_type: 'Confidence',
          activity_text: 'Take initiative in one small interaction today that you usually avoid.',
          completed: false,
          activity_date: targetDate,
        },
      ];
      this.data.daily_activities.push(...activities);
      this.save();
    }

    return activities;
  }

  public toggleDailyActivity(userId: string, activityId: string): DailyActivity {
    const act = this.data.daily_activities.find(a => a.id === activityId && a.user_id === userId);
    if (!act) throw new Error('Daily activity not found.');

    act.completed = !act.completed;
    act.completed_at = act.completed ? new Date().toISOString() : undefined;

    // Recalculate daily growth streak and persist user streak_count
    const streakInfo = this.getDailyGrowthStreak(userId);
    const user = this.getUserById(userId);
    if (user) {
      user.streak_count = streakInfo.currentStreak;
    }
    this.save();
    return act;
  }

  // --- Confidence Activities Operations ---
  public getConfidenceActivities(userId: string): ConfidenceActivity[] {
    return this.data.confidence_activities.filter(c => c.user_id === userId);
  }

  public toggleConfidenceActivity(userId: string, activityId: string, reflection?: string): ConfidenceActivity {
    const act = this.data.confidence_activities.find(c => c.id === activityId && c.user_id === userId);
    if (!act) throw new Error('Confidence activity not found.');

    act.completed = !act.completed;
    act.completed_at = act.completed ? new Date().toISOString() : undefined;
    if (reflection) act.user_reflection = reflection;

    if (act.completed) {
      this.touchUserActivity(userId);
    }
    this.save();
    return act;
  }

  // --- English Progress Operations ---
  public getEnglishProgress(userId: string): EnglishProgress {
    let p = this.data.english_progress.find(ep => ep.user_id === userId);
    if (!p) {
      p = {
        id: `eng-${userId}`,
        user_id: userId,
        grammar_score: 68,
        vocabulary_score: 65,
        fluency_score: 60,
        confidence_score: 65,
        exercises_completed: 0,
        recorded_date: getTodayStr(),
      };
      this.data.english_progress.push(p);
      this.save();
    }
    return p;
  }

  public updateEnglishScores(userId: string, scores: {
    grammar?: number;
    vocabulary?: number;
    fluency?: number;
    confidence?: number;
  }): EnglishProgress {
    const p = this.getEnglishProgress(userId);
    if (scores.grammar !== undefined) p.grammar_score = Math.min(100, Math.max(0, Math.round((p.grammar_score * 3 + scores.grammar) / 4)));
    if (scores.vocabulary !== undefined) p.vocabulary_score = Math.min(100, Math.max(0, Math.round((p.vocabulary_score * 3 + scores.vocabulary) / 4)));
    if (scores.fluency !== undefined) p.fluency_score = Math.min(100, Math.max(0, Math.round((p.fluency_score * 3 + scores.fluency) / 4)));
    if (scores.confidence !== undefined) p.confidence_score = Math.min(100, Math.max(0, Math.round((p.confidence_score * 3 + scores.confidence) / 4)));
    p.exercises_completed += 1;
    p.recorded_date = getTodayStr();

    this.touchUserActivity(userId);
    this.save();
    return p;
  }

  // --- English Practice Sessions & Weekly Activity ---
  public getEnglishWeeklyActivity(userId: string): EnglishWeeklyActivity {
    this.ensureDemoEnglishPracticeData();
    const sessions = (this.data.english_practice_sessions || []).filter(s => s.user_id === userId);
    const today = new Date();
    const todayStr = getTodayStr();

    // Determine Monday of current week
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const currentWeekDays: DayPracticeData[] = [];
    let weekTotalMinutes = 0;
    let bestDay = { day: 'Mon', hours: 0 };

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const daySessions = sessions.filter(s => s.date === dateStr);
      let dayMins = 0;
      let speakingMins = 0;
      let interviewMins = 0;
      let vocabGrammarMins = 0;

      for (const s of daySessions) {
        dayMins += s.minutes || 0;
        if (s.category === 'speaking' || s.category === 'presentation') {
          speakingMins += s.minutes || 0;
        } else if (s.category === 'interview') {
          interviewMins += s.minutes || 0;
        } else {
          vocabGrammarMins += s.minutes || 0;
        }
      }

      weekTotalMinutes += dayMins;
      const hours = Math.round((dayMins / 60) * 10) / 10;
      const speakingHours = Math.round((speakingMins / 60) * 10) / 10;
      const interviewHours = Math.round((interviewMins / 60) * 10) / 10;
      const vocabGrammarHours = Math.round((vocabGrammarMins / 60) * 10) / 10;

      if (hours > bestDay.hours) {
        bestDay = { day: dayLabels[i], hours };
      }

      currentWeekDays.push({
        day: dayLabels[i],
        fullDay: fullDayLabels[i],
        date: dateStr,
        hours,
        minutes: dayMins,
        speakingHours,
        interviewHours,
        vocabGrammarHours,
        targetHours: 0.8, // standard daily recommended goal ~48 mins
        isToday: dateStr === todayStr,
      });
    }

    const totalHoursThisWeek = Math.round((weekTotalMinutes / 60) * 10) / 10;
    const weeklyTargetHours = 5.6; // 0.8h * 7 days
    const dailyAverageHours = Math.round((totalHoursThisWeek / 7) * 10) / 10;
    const targetCompletionPercent = Math.min(100, Math.round((totalHoursThisWeek / weeklyTargetHours) * 100));

    // Calculate 4-week trend (3 weeks ago, 2 weeks ago, last week, this week)
    const fourWeekTrend: WeekTrendData[] = [];
    const weekOffsets = [3, 2, 1, 0];
    const weekNames = ['3 Weeks Ago', '2 Weeks Ago', 'Last Week', 'This Week'];

    let lastWeekTotalMinutes = 0;

    for (let w = 0; w < weekOffsets.length; w++) {
      const offsetWeeks = weekOffsets[w];
      const startD = new Date(monday);
      startD.setDate(monday.getDate() - offsetWeeks * 7);
      const endD = new Date(startD);
      endD.setDate(startD.getDate() + 6);

      const startStr = startD.toISOString().split('T')[0];
      const endStr = endD.toISOString().split('T')[0];

      const wSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr);
      const wMins = wSessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
      const wHours = Math.round((wMins / 60) * 10) / 10;

      if (offsetWeeks === 1) {
        lastWeekTotalMinutes = wMins;
      }

      fourWeekTrend.push({
        week: weekNames[w],
        hours: wHours,
        targetHours: weeklyTargetHours,
        sessionsCount: wSessions.length,
      });
    }

    let comparedToLastWeekPercent = 14;
    if (lastWeekTotalMinutes > 0) {
      comparedToLastWeekPercent = Math.round(((weekTotalMinutes - lastWeekTotalMinutes) / lastWeekTotalMinutes) * 100);
    }

    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return {
      currentWeekDays,
      fourWeekTrend,
      totalHoursThisWeek,
      dailyAverageHours,
      weeklyTargetHours,
      targetCompletionPercent,
      bestDay: bestDay.hours > 0 ? bestDay : { day: 'Thu', hours: 1.2 },
      totalSessionsCount: sessions.length,
      comparedToLastWeekPercent,
      recentSessions,
    };
  }

  public logEnglishPractice(userId: string, data: {
    minutes: number;
    category?: 'speaking' | 'interview' | 'presentation' | 'vocabulary' | 'grammar';
    title?: string;
    notes?: string;
    date?: string;
  }): { session: EnglishPracticeSession; weeklyActivity: EnglishWeeklyActivity } {
    if (!this.data.english_practice_sessions) {
      this.data.english_practice_sessions = [];
    }

    const sessionDate = data.date || getTodayStr();
    const minutes = Math.max(1, Math.min(360, Math.round(data.minutes || 15)));
    const category = data.category || 'speaking';

    const session: EnglishPracticeSession = {
      id: `session-eng-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      user_id: userId,
      date: sessionDate,
      minutes,
      category,
      title: data.title || `${category.charAt(0).toUpperCase() + category.slice(1)} Practice`,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    this.data.english_practice_sessions.push(session);

    // Also update progress exercise count & touch user activity
    const p = this.getEnglishProgress(userId);
    p.exercises_completed += 1;
    this.touchUserActivity(userId);
    this.save();

    const weeklyActivity = this.getEnglishWeeklyActivity(userId);
    return { session, weeklyActivity };
  }

  public sanitizeHistoricalErrorMessages(): void {
    if (!this.data.chat_sessions) return;
    let modified = false;
    for (const session of this.data.chat_sessions) {
      if (session.messages) {
        for (const msg of session.messages) {
          if (
            msg.message &&
            (msg.message.includes('AI connection encountered an error') ||
             msg.message.includes('"code":503') ||
             msg.message.includes('"status":"UNAVAILABLE"'))
          ) {
            msg.message =
              "I hear you. When things feel overwhelming or heavy, it's completely okay to pause and let yourself recharge. Take a slow, deep breath—you don't have to carry everything all at once. What feels like the kindest thing you can do for yourself right now?";
            modified = true;
          }
        }
      }
    }
    if (modified) {
      this.save();
    }
  }

  public ensureDemoEnglishPracticeData(): void {
    if (!this.data.english_practice_sessions) {
      this.data.english_practice_sessions = [];
    }

    const demoUserId = 'demo-user-alex';
    const demoUser = this.getUserById(demoUserId);
    if (!demoUser) return;

    const existing = this.data.english_practice_sessions.filter(s => s.user_id === demoUserId);
    if (existing.length >= 8) return;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const getDateStr = (baseDate: Date, offsetDays: number): string => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const newSessions: EnglishPracticeSession[] = [
      // 3 Weeks Ago (Total ~ 3.2 hrs)
      {
        id: `demo-eng-w3-1`,
        user_id: demoUserId,
        date: getDateStr(monday, -21),
        minutes: 45,
        category: 'speaking',
        title: 'Spoken English: Self Introduction',
        created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w3-2`,
        user_id: demoUserId,
        date: getDateStr(monday, -19),
        minutes: 60,
        category: 'interview',
        title: 'Behavioral Interview STAR Framework',
        created_at: new Date(Date.now() - 19 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w3-3`,
        user_id: demoUserId,
        date: getDateStr(monday, -17),
        minutes: 40,
        category: 'vocabulary',
        title: 'Professional Tech Vocabulary',
        created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w3-4`,
        user_id: demoUserId,
        date: getDateStr(monday, -15),
        minutes: 45,
        category: 'presentation',
        title: '2-Minute Impromptu Pitch',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },

      // 2 Weeks Ago (Total ~ 4.2 hrs)
      {
        id: `demo-eng-w2-1`,
        user_id: demoUserId,
        date: getDateStr(monday, -14),
        minutes: 50,
        category: 'speaking',
        title: 'Overcoming Spoken Hesitation',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w2-2`,
        user_id: demoUserId,
        date: getDateStr(monday, -12),
        minutes: 65,
        category: 'interview',
        title: 'Technical Project Defense Questions',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w2-3`,
        user_id: demoUserId,
        date: getDateStr(monday, -10),
        minutes: 45,
        category: 'presentation',
        title: 'Slide-Free Presentation Delivery',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w2-4`,
        user_id: demoUserId,
        date: getDateStr(monday, -8),
        minutes: 90,
        category: 'speaking',
        title: 'Mock Group Discussion: AI Ethics',
        created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      },

      // Last Week (Total ~ 4.6 hrs)
      {
        id: `demo-eng-w1-1`,
        user_id: demoUserId,
        date: getDateStr(monday, -7),
        minutes: 60,
        category: 'speaking',
        title: 'Spoken Fluency Drills',
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w1-2`,
        user_id: demoUserId,
        date: getDateStr(monday, -5),
        minutes: 75,
        category: 'interview',
        title: 'Internship Placement Mock Interview',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w1-3`,
        user_id: demoUserId,
        date: getDateStr(monday, -4),
        minutes: 50,
        category: 'grammar',
        title: 'Tense Precision & Polished Transitions',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w1-4`,
        user_id: demoUserId,
        date: getDateStr(monday, -2),
        minutes: 90,
        category: 'presentation',
        title: 'Campus Capstone Rehearsal',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },

      // This Week (Current Week: Mon - Sun)
      {
        id: `demo-eng-w0-mon`,
        user_id: demoUserId,
        date: getDateStr(monday, 0),
        minutes: 50,
        category: 'speaking',
        title: 'Morning Vocal Warm-Up & Read-Aloud',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w0-tue`,
        user_id: demoUserId,
        date: getDateStr(monday, 1),
        minutes: 65,
        category: 'interview',
        title: 'STAR Method Live Answering',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w0-wed`,
        user_id: demoUserId,
        date: getDateStr(monday, 2),
        minutes: 40,
        category: 'vocabulary',
        title: 'Nuanced College & Career Vocabulary',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w0-thu`,
        user_id: demoUserId,
        date: getDateStr(monday, 3),
        minutes: 85,
        category: 'presentation',
        title: 'Capstone Presentation 2-Min Drills',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: `demo-eng-w0-fri`,
        user_id: demoUserId,
        date: getDateStr(monday, 4),
        minutes: 55,
        category: 'speaking',
        title: 'Casual Conversation Confidence Challenge',
        created_at: new Date().toISOString(),
      },
      {
        id: `demo-eng-w0-sat`,
        user_id: demoUserId,
        date: getDateStr(monday, 5),
        minutes: 40,
        category: 'speaking',
        title: 'Accent Neutrality & Pausing Techniques',
        created_at: new Date().toISOString(),
      },
    ];

    this.data.english_practice_sessions.push(...newSessions);
  }

  // --- Chat Operations ---
  public getChatSessions(userId: string): ChatSession[] {
    let userSessions = this.data.chat_sessions.filter(s => s.user_id === userId);
    if (userSessions.length === 0) {
      const defaultSession = this.getOrCreateChatSession(userId);
      return [defaultSession];
    }
    // Return sorted by updated_at or created_at descending (newest first)
    return userSessions.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    });
  }

  public getChatSessionById(userId: string, sessionId: string): ChatSession | undefined {
    return this.data.chat_sessions.find(s => s.id === sessionId && s.user_id === userId);
  }

  public createNewChatSession(userId: string, mode: string = 'life', title?: string, isVent?: boolean): ChatSession {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      user_id: userId,
      title: title || (isVent ? 'Safe Vent Sanctuary' : 'New Coaching Session'),
      mode: mode || 'life',
      is_vent: !!isVent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          session_id: `session-new`,
          sender: 'assistant',
          message: isVent
            ? "Welcome to your Safe Vent Sanctuary. There are no judgments here, no expectations, and no rush. Type whatever is on your mind, big or small. I'm listening."
            : "Hello! I'm your GrowWise mentor. How can I support your confidence, communication, or goals today?",
          timestamp: new Date().toISOString(),
        },
      ],
    };
    this.data.chat_sessions.unshift(newSession);
    this.save();
    return newSession;
  }

  public getOrCreateChatSession(userId: string, sessionId?: string): ChatSession {
    if (sessionId) {
      const existing = this.getChatSessionById(userId, sessionId);
      if (existing) return existing;
    }

    let session = this.data.chat_sessions.find(s => s.user_id === userId);
    if (!session) {
      session = {
        id: `session-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        user_id: userId,
        title: 'Growth Coaching Session',
        mode: 'general',
        is_vent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [
          {
            id: `msg-init-${Date.now()}`,
            session_id: `session-${userId}`,
            sender: 'assistant',
            message: "Hello! I'm GrowWise 🌱 I'm here to support your personal growth, communication skills, and confidence. How are you feeling today?",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      this.data.chat_sessions.push(session);
      this.save();
    }
    return session;
  }

  public addChatMessage(userId: string, sender: 'user' | 'assistant', message: string, action_type?: string, sessionId?: string): ChatMessage {
    const session = this.getOrCreateChatSession(userId, sessionId);
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      session_id: session.id,
      sender,
      message,
      action_type,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(msg);
    session.updated_at = new Date().toISOString();

    // Auto-update session title from first user message if title is default
    if (sender === 'user') {
      this.touchUserActivity(userId);
      if (session.title === 'Growth Coaching Session' || session.title === 'New Coaching Session' || session.title === 'Safe Vent Sanctuary') {
        const cleanSnippet = message.replace(/\n/g, ' ').trim();
        session.title = cleanSnippet.length > 36 ? `${cleanSnippet.slice(0, 36)}...` : cleanSnippet;
      }
    }
    this.save();
    return msg;
  }

  public deleteChatSession(userId: string, sessionId: string): boolean {
    const initialLen = this.data.chat_sessions.length;
    this.data.chat_sessions = this.data.chat_sessions.filter(
      s => !(s.id === sessionId && s.user_id === userId)
    );
    const deleted = this.data.chat_sessions.length < initialLen;
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  public clearChatHistory(userId: string, sessionId?: string): void {
    const session = this.getOrCreateChatSession(userId, sessionId);
    session.messages = [
      {
        id: `msg-reset-${Date.now()}`,
        session_id: session.id,
        sender: 'assistant',
        message: session.is_vent
          ? "Safe vent space refreshed. What would you like to share or get off your chest?"
          : "Your conversation history in this session has been cleared. What would you like to reflect on or practice today?",
        timestamp: new Date().toISOString(),
      },
    ];
    session.updated_at = new Date().toISOString();
    this.save();
  }

  // --- Daily Growth Streak & Badges ---
  public getDailyGrowthStreak(userId: string): DailyGrowthStreak {
    const todayStr = getTodayStr();
    const userActs = this.data.daily_activities.filter(a => a.user_id === userId);

    // Group activities by date
    const dateMap = new Map<string, DailyActivity[]>();
    for (const act of userActs) {
      if (!dateMap.has(act.activity_date)) {
        dateMap.set(act.activity_date, []);
      }
      dateMap.get(act.activity_date)!.push(act);
    }

    const isDateCompleted = (dateStr: string): boolean => {
      const acts = dateMap.get(dateStr);
      if (!acts || acts.length < 3) return false;
      return acts.every(a => a.completed);
    };

    const todayActs = this.getDailyActivities(userId, todayStr);
    const todayCompletedCount = todayActs.filter(a => a.completed).length;
    const isTodayCompleted = todayCompletedCount >= 3;

    const getPrevDateStr = (dateStr: string, daysAgo: number = 1): string => {
      const d = new Date(dateStr + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    let currentStreak = 0;
    let status: 'completed_today' | 'pending_today' | 'broken' | 'fresh_start' = 'fresh_start';

    const yesterdayStr = getPrevDateStr(todayStr, 1);
    const wasYesterdayCompleted = isDateCompleted(yesterdayStr);

    if (isTodayCompleted) {
      currentStreak = 1;
      let checkDate = yesterdayStr;
      while (isDateCompleted(checkDate)) {
        currentStreak++;
        checkDate = getPrevDateStr(checkDate, 1);
      }
      status = 'completed_today';
    } else if (wasYesterdayCompleted) {
      // Streak from prior days is maintained if finished today
      currentStreak = 0;
      let checkDate = yesterdayStr;
      while (isDateCompleted(checkDate)) {
        currentStreak++;
        checkDate = getPrevDateStr(checkDate, 1);
      }
      status = 'pending_today';
    } else {
      currentStreak = 0;
      const anyCompletedEver = Array.from(dateMap.keys()).some(d => isDateCompleted(d));
      status = anyCompletedEver ? 'broken' : 'fresh_start';
    }

    // Best streak calculation across all time
    const allDates = Array.from(dateMap.keys()).sort();
    let bestStreak = currentStreak;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of allDates) {
      if (isDateCompleted(dStr)) {
        const curr = new Date(dStr + 'T12:00:00Z');
        if (prevDate) {
          const diffDays = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        prevDate = curr;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
        prevDate = null;
      }
    }

    // Construct encouraging messaging with non-guilt philosophy
    let message = '';
    if (status === 'completed_today') {
      message = currentStreak >= 5
        ? `🔥 ${currentStreak} day growth streak! Incredible dedication. You completed all 3 daily practices today.`
        : `🔥 ${currentStreak} day growth streak! You showed up and finished all 3 daily practices today.`;
    } else if (status === 'pending_today') {
      const remaining = 3 - todayCompletedCount;
      message = `🔥 ${currentStreak} day growth streak! Complete ${remaining} more practice${remaining > 1 ? 's' : ''} today to keep it growing strong.`;
    } else {
      // Broken streak or fresh start - strictly non-guilt
      message = "Missed a day? That's completely okay. Growth isn't ruined by one missed day. Take a breath and start again today.";
    }

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      todayCompletedCount,
      todayTotal: 3,
      isTodayCompleted,
      status,
      message,
    };
  }

  public getBadges(userId: string): Badge[] {
    const streakInfo = this.getDailyGrowthStreak(userId);
    const journals = this.getJournalEntries(userId);
    const confs = this.getConfidenceActivities(userId);
    const session = this.getOrCreateChatSession(userId);
    const goals = this.getGoals(userId);
    const eng = this.getEnglishProgress(userId);

    const userChatCount = session.messages.filter(m => m.sender === 'user').length;
    const journalCount = journals.length;
    const reflectionsCount = journals.filter(j => !!j.ai_reflection).length;

    const beginnerConfs = confs.filter(c => c.difficulty === 'Beginner');
    const beginnerCompleted = beginnerConfs.filter(c => c.completed).length;
    const totalBeginner = Math.max(beginnerConfs.length, 4);

    const intermediateConfs = confs.filter(c => c.difficulty === 'Intermediate');
    const intermediateCompleted = intermediateConfs.filter(c => c.completed).length;

    const anyTrifecta = streakInfo.bestStreak >= 1 || streakInfo.isTodayCompleted;

    const badges: Badge[] = [
      // 1. Explicitly requested: 'First AI conversation'
      {
        id: 'badge-first-ai-conversation',
        name: 'First AI conversation',
        description: 'Held your first meaningful dialogue with the AI Growth Companion',
        category: 'ai',
        icon: 'MessageSquare',
        unlocked: userChatCount >= 1,
        unlocked_at: userChatCount >= 1 ? session.messages.find(m => m.sender === 'user')?.timestamp : undefined,
        progress: {
          current: Math.min(userChatCount, 1),
          max: 1,
          label: userChatCount >= 1 ? 'Unlocked' : '0/1 conversation',
        },
        tier: 'Bronze',
      },

      // 2. Explicitly requested: '10 Journal Entries'
      {
        id: 'badge-10-journal-entries',
        name: '10 Journal Entries',
        description: 'Built a consistent reflective practice with 10 saved journal entries',
        category: 'journal',
        icon: 'BookOpen',
        unlocked: journalCount >= 10,
        unlocked_at: journalCount >= 10 ? journals[0]?.created_at : undefined,
        progress: {
          current: Math.min(journalCount, 10),
          max: 10,
          label: `${journalCount} / 10 entries`,
        },
        tier: 'Silver',
      },

      // 3. Explicitly requested: 'Confidence Booster Level 1 Complete'
      {
        id: 'badge-confidence-booster-level-1',
        name: 'Confidence Booster Level 1 Complete',
        description: 'Stepped out of your comfort zone and conquered Level 1 Beginner confidence challenges',
        category: 'confidence',
        icon: 'Award',
        unlocked: beginnerCompleted >= totalBeginner && totalBeginner > 0,
        unlocked_at: (beginnerCompleted >= totalBeginner && totalBeginner > 0) ? new Date().toISOString() : undefined,
        progress: {
          current: beginnerCompleted,
          max: totalBeginner,
          label: `${beginnerCompleted} / ${totalBeginner} challenges`,
        },
        tier: 'Gold',
      },

      // 4. Streak Badges
      {
        id: 'badge-daily-trifecta',
        name: 'Daily Trifecta',
        description: 'Completed all 3 daily growth practices (Mind, Communication, Confidence) in one day',
        category: 'streak',
        icon: 'Sparkles',
        unlocked: anyTrifecta,
        progress: {
          current: anyTrifecta ? 1 : 0,
          max: 1,
          label: anyTrifecta ? 'Completed' : `${streakInfo.todayCompletedCount}/3 today`,
        },
        tier: 'Bronze',
      },
      {
        id: 'badge-3-day-streak',
        name: '3-Day Growth Streak',
        description: 'Maintained consecutive daily growth practices for 3 days',
        category: 'streak',
        icon: 'Flame',
        unlocked: streakInfo.currentStreak >= 3 || streakInfo.bestStreak >= 3,
        progress: {
          current: Math.min(Math.max(streakInfo.currentStreak, streakInfo.bestStreak), 3),
          max: 3,
          label: `${Math.min(Math.max(streakInfo.currentStreak, streakInfo.bestStreak), 3)} / 3 days`,
        },
        tier: 'Bronze',
      },
      {
        id: 'badge-5-day-streak',
        name: '5-Day Growth Streak',
        description: 'Completed all 3 daily growth activities for 5 consecutive days without breaking momentum',
        category: 'streak',
        icon: 'Flame',
        unlocked: streakInfo.currentStreak >= 5 || streakInfo.bestStreak >= 5,
        progress: {
          current: Math.min(Math.max(streakInfo.currentStreak, streakInfo.bestStreak), 5),
          max: 5,
          label: `${Math.min(Math.max(streakInfo.currentStreak, streakInfo.bestStreak), 5)} / 5 days`,
        },
        tier: 'Silver',
      },

      // 5. Reflection Badges
      {
        id: 'badge-first-reflection',
        name: 'First Journal Entry',
        description: 'Paused to record your authentic thoughts, emotions, and personal takeaways',
        category: 'journal',
        icon: 'PenTool',
        unlocked: journalCount >= 1,
        progress: {
          current: Math.min(journalCount, 1),
          max: 1,
          label: journalCount >= 1 ? 'Unlocked' : '0/1 entry',
        },
        tier: 'Bronze',
      },
      {
        id: 'badge-ai-reflection',
        name: 'AI Guided Reflection',
        description: 'Generated psychological reframing and pattern analysis with AI companion',
        category: 'journal',
        icon: 'Sparkles',
        unlocked: reflectionsCount >= 1,
        progress: {
          current: Math.min(reflectionsCount, 1),
          max: 1,
          label: reflectionsCount >= 1 ? 'Unlocked' : '0/1 reflection',
        },
        tier: 'Silver',
      },

      // 6. Confidence & English & Goals Badges
      {
        id: 'badge-confidence-level-2',
        name: 'Confidence Booster Level 2',
        description: 'Conquered Intermediate real-world public speaking and social presence exercises',
        category: 'confidence',
        icon: 'TrendingUp',
        unlocked: intermediateCompleted >= 3,
        progress: {
          current: intermediateCompleted,
          max: 4,
          label: `${intermediateCompleted} / 4 challenges`,
        },
        tier: 'Gold',
      },
      {
        id: 'badge-voice-practice',
        name: 'Voice & Expression',
        description: 'Practiced Spoken English or Interview preparation with AI feedback',
        category: 'english',
        icon: 'Mic',
        unlocked: eng.exercises_completed >= 1,
        progress: {
          current: Math.min(eng.exercises_completed, 1),
          max: 1,
          label: eng.exercises_completed >= 1 ? 'Unlocked' : '0/1 exercise',
        },
        tier: 'Silver',
      },
      {
        id: 'badge-goal-visionary',
        name: 'Goal Visionary',
        description: 'Defined clear milestones for a long-term personal growth goal',
        category: 'goals',
        icon: 'Target',
        unlocked: goals.length >= 1,
        progress: {
          current: Math.min(goals.length, 1),
          max: 1,
          label: goals.length >= 1 ? 'Unlocked' : '0/1 goal',
        },
        tier: 'Bronze',
      },
      {
        id: 'badge-milestone-crusher',
        name: 'Milestone Crusher',
        description: 'Successfully finished all milestones of a target goal',
        category: 'goals',
        icon: 'CheckCircle2',
        unlocked: goals.some(g => g.status === 'completed' || (g.milestones.length > 0 && g.milestones.every(m => m.completed))),
        progress: {
          current: goals.filter(g => g.status === 'completed' || (g.milestones.length > 0 && g.milestones.every(m => m.completed))).length,
          max: 1,
          label: goals.some(g => g.status === 'completed') ? 'Unlocked' : '0/1 goal',
        },
        tier: 'Special',
      },
    ];

    return badges;
  }

  public simulateBreakStreak(userId: string): DailyGrowthStreak {
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const todayStr = getTodayStr();
    for (const a of this.data.daily_activities) {
      if (a.user_id === userId && (a.activity_date === yesterdayStr || a.activity_date === todayStr)) {
        a.completed = false;
        a.completed_at = undefined;
      }
    }
    const user = this.getUserById(userId);
    if (user) {
      user.streak_count = 0;
    }
    this.save();
    return this.getDailyGrowthStreak(userId);
  }

  public restoreDemoStreak(userId: string): DailyGrowthStreak {
    this.ensureDemoStreakData();
    const todayStr = getTodayStr();
    for (const a of this.data.daily_activities) {
      if (a.user_id === userId && a.activity_date === todayStr) {
        if (a.activity_type === 'Confidence') {
          a.completed = false;
          a.completed_at = undefined;
        } else {
          a.completed = true;
          a.completed_at = new Date().toISOString();
        }
      }
    }
    const user = this.getUserById(userId);
    if (user) {
      user.streak_count = 4;
    }
    this.save();
    return this.getDailyGrowthStreak(userId);
  }

  public ensureDemoStreakData(): void {
    const demoUserId = 'demo-user-alex';
    const demoUser = this.getUserById(demoUserId);
    if (!demoUser) return;

    for (let dayOffset = 1; dayOffset <= 4; dayOffset++) {
      const pastDate = new Date(Date.now() - dayOffset * 86400000).toISOString().split('T')[0];
      const existing = this.data.daily_activities.filter(a => a.user_id === demoUserId && a.activity_date === pastDate);
      if (existing.length < 3) {
        this.data.daily_activities.push(
          {
            id: `daily-mind-${demoUserId}-${pastDate}`,
            user_id: demoUserId,
            activity_type: 'Mind',
            activity_text: dayOffset === 1
              ? 'Acknowledge one personal boundary you maintained today.'
              : dayOffset === 2
              ? 'Identify a moment today when you chose patience over frustration.'
              : dayOffset === 3
              ? 'Recall a small win you almost dismissed without celebrating.'
              : 'Write down what felt draining vs. what gave you quiet energy today.',
            completed: true,
            activity_date: pastDate,
            completed_at: new Date(Date.now() - dayOffset * 86400000 + 3600000).toISOString(),
          },
          {
            id: `daily-comm-${demoUserId}-${pastDate}`,
            user_id: demoUserId,
            activity_type: 'Communication',
            activity_text: dayOffset === 1
              ? 'Summarize an interesting article or video out loud in 60 seconds.'
              : dayOffset === 2
              ? 'Practice pausing for 2 seconds before answering a question.'
              : dayOffset === 3
              ? 'Express sincere appreciation to someone who helped you this week.'
              : 'Explain a technical concept simply as if to a middle school student.',
            completed: true,
            activity_date: pastDate,
            completed_at: new Date(Date.now() - dayOffset * 86400000 + 7200000).toISOString(),
          },
          {
            id: `daily-conf-${demoUserId}-${pastDate}`,
            user_id: demoUserId,
            activity_type: 'Confidence',
            activity_text: dayOffset === 1
              ? 'Sit in the front two rows of a lecture or seminar.'
              : dayOffset === 2
              ? 'Walk with shoulders relaxed and eyes forward across campus plaza.'
              : dayOffset === 3
              ? 'Send an email asking for advice without apologizing for asking.'
              : 'Introduce yourself by name with a firm, calm voice to a peer.',
            completed: true,
            activity_date: pastDate,
            completed_at: new Date(Date.now() - dayOffset * 86400000 + 10800000).toISOString(),
          }
        );
      } else {
        for (const act of existing) {
          act.completed = true;
          if (!act.completed_at) {
            act.completed_at = new Date(Date.now() - dayOffset * 86400000 + 3600000).toISOString();
          }
        }
      }
    }
  }

  // --- User Overall Stats Calculation ---
  public getUserStats(userId: string) {
    const goals = this.getGoals(userId);
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const journals = this.getJournalEntries(userId);
    const reflectionsCount = journals.filter(j => j.ai_reflection).length;
    const confidenceActivities = this.getConfidenceActivities(userId);
    const totalConfidence = confidenceActivities.length;
    const completedConfidence = confidenceActivities.filter(c => c.completed).length;
    const confidencePercent = totalConfidence > 0 ? Math.round((completedConfidence / totalConfidence) * 100) : 60;

    const eng = this.getEnglishProgress(userId);
    const englishOverall = Math.round((eng.grammar_score + eng.vocabulary_score + eng.fluency_score + eng.confidence_score) / 4);

    const todayActivities = this.getDailyActivities(userId);
    const completedDailyToday = todayActivities.filter(a => a.completed).length;

    // All-time daily activities completed
    const allDailyCompleted = this.data.daily_activities.filter(a => a.user_id === userId && a.completed).length;

    // Accurate 3-activity daily streak
    const dailyGrowthStreak = this.getDailyGrowthStreak(userId);
    const badges = this.getBadges(userId);

    // Sync streak_count on user object
    const user = this.getUserById(userId);
    if (user) {
      user.streak_count = dailyGrowthStreak.currentStreak;
    }

    return {
      confidencePercent,
      englishOverall,
      englishBreakdown: {
        grammar: eng.grammar_score,
        vocabulary: eng.vocabulary_score,
        fluency: eng.fluency_score,
        confidence: eng.confidence_score,
        exercisesCompleted: eng.exercises_completed,
      },
      dailyActivitiesCompleted: allDailyCompleted,
      todayDailyGrowth: {
        completed: completedDailyToday,
        total: 3,
      },
      journalCount: journals.length,
      reflectionsCount,
      activeGoalsCount: activeGoals,
      totalGoalsCount: goals.length,
      streakDays: dailyGrowthStreak.currentStreak,
      totalPoints: confidenceActivities.filter(c => c.completed).reduce((sum, c) => sum + c.points, 0),
      dailyGrowthStreak,
      badges,
      englishWeeklyActivity: this.getEnglishWeeklyActivity(userId),
    };
  }

  // --- Privacy & Data Management ---
  public clearUserJournals(userId: string) {
    this.data.journal_entries = this.data.journal_entries.filter(j => j.user_id !== userId);
    this.save();
  }

  public deleteUserAccount(userId: string) {
    this.data.users = this.data.users.filter(u => u.id !== userId);
    this.data.user_goals = this.data.user_goals.filter(g => g.user_id !== userId);
    this.data.journal_entries = this.data.journal_entries.filter(j => j.user_id !== userId);
    this.data.daily_activities = this.data.daily_activities.filter(a => a.user_id !== userId);
    this.data.confidence_activities = this.data.confidence_activities.filter(c => c.user_id !== userId);
    this.data.english_progress = this.data.english_progress.filter(e => e.user_id !== userId);
    this.data.english_practice_sessions = (this.data.english_practice_sessions || []).filter(s => s.user_id !== userId);
    this.data.chat_sessions = this.data.chat_sessions.filter(s => s.user_id !== userId);
    this.save();
  }
}

export const db = new Database();
