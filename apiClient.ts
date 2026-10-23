import {
  User,
  UserGoal,
  JournalEntry,
  DailyActivity,
  ConfidenceActivity,
  EnglishProgress,
  ChatSession,
  ChatSessionSummary,
  UserStats,
  EnglishEvaluation,
  DailyGrowthStreak,
  Badge,
  EnglishWeeklyActivity,
  EnglishPracticeSession,
} from '../types';

const TOKEN_KEY = 'growwise_auth_token';
const CACHE_PREFIX = 'growwise_cache_';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['x-user-id'] = this.token;
    }
    return headers;
  }

  private saveToCache(key: string, data: any) {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage cache write error:', e);
    }
  }

  private getFromCache<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data as T;
    } catch (err: any) {
      // Offline fallback: if GET request, attempt cache lookup
      if (options.method === undefined || options.method === 'GET') {
        const cached = this.getFromCache<T>(endpoint);
        if (cached) {
          return cached;
        }
      }
      throw err;
    }
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    this.saveToCache('current_user', res.user);
    return res;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    real_name?: string;
    nickname?: string;
    student_id?: string;
    college_name?: string;
    confirmPassword?: string;
    age?: number;
    education_level?: string;
    main_growth_goal?: string;
    onboarding_completed?: boolean;
  }): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    this.saveToCache('current_user', res.user);
    return res;
  }

  async demoLogin(): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/demo', {
      method: 'POST',
    });
    this.setToken(res.token);
    this.saveToCache('current_user', res.user);
    return res;
  }

  async getMe(): Promise<{ user: User }> {
    const res = await this.request<{ user: User }>('/api/auth/me');
    this.saveToCache('current_user', res.user);
    return res;
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    const res = await this.request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    this.saveToCache('current_user', res.user);
    return res;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem(`${CACHE_PREFIX}current_user`);
  }

  // --- Goals ---
  async getGoals(): Promise<UserGoal[]> {
    const goals = await this.request<UserGoal[]>('/api/goals');
    this.saveToCache('/api/goals', goals);
    return goals;
  }

  async createGoal(data: {
    title: string;
    description: string;
    category: UserGoal['category'];
    deadline: string;
    milestones: string[];
  }): Promise<UserGoal> {
    return this.request<UserGoal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(id: string, updates: Partial<UserGoal>): Promise<UserGoal> {
    return this.request<UserGoal>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGoal(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Journal ---
  async getJournal(params?: { search?: string; mood?: string }): Promise<JournalEntry[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.mood) query.append('mood', params.mood);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const entries = await this.request<JournalEntry[]>(`/api/journal${qs}`);
    if (!qs) this.saveToCache('/api/journal', entries);
    return entries;
  }

  async createJournalEntry(data: { title: string; content: string; mood: string }): Promise<JournalEntry> {
    return this.request<JournalEntry>('/api/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/api/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteJournalEntry(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/journal/${id}`, {
      method: 'DELETE',
    });
  }

  async reflectOnJournal(id: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/api/journal/${id}/reflect`, {
      method: 'POST',
    });
  }

  // --- Daily Growth ---
  async getDailyActivities(): Promise<DailyActivity[]> {
    const activities = await this.request<DailyActivity[]>('/api/daily');
    this.saveToCache('/api/daily', activities);
    return activities;
  }

  async toggleDailyActivity(id: string): Promise<DailyActivity> {
    return this.request<DailyActivity>(`/api/daily/${id}/toggle`, {
      method: 'POST',
    });
  }

  // --- Confidence Activities ---
  async getConfidenceActivities(): Promise<ConfidenceActivity[]> {
    const list = await this.request<ConfidenceActivity[]>('/api/confidence');
    this.saveToCache('/api/confidence', list);
    return list;
  }

  async toggleConfidenceActivity(id: string, reflection?: string): Promise<ConfidenceActivity> {
    return this.request<ConfidenceActivity>(`/api/confidence/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ reflection }),
    });
  }

  // --- English Practice ---
  async getEnglishProgress(): Promise<EnglishProgress> {
    const p = await this.request<EnglishProgress>('/api/english/progress');
    this.saveToCache('/api/english/progress', p);
    return p;
  }

  async evaluateEnglish(data: {
    userInput: string;
    topic: string;
    mode: 'speaking' | 'interview' | 'situational' | 'general';
  }): Promise<{ evaluation: EnglishEvaluation; progress: EnglishProgress }> {
    return this.request<{ evaluation: EnglishEvaluation; progress: EnglishProgress }>('/api/english/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInterviewQuestion(role?: string, difficulty?: string): Promise<{ question: string; tips: string[]; framework: string }> {
    return this.request<{ question: string; tips: string[]; framework: string }>('/api/english/interview-question', {
      method: 'POST',
      body: JSON.stringify({ role, difficulty }),
    });
  }

  async getEnglishWeeklyActivity(): Promise<EnglishWeeklyActivity> {
    const data = await this.request<EnglishWeeklyActivity>('/api/english/weekly-activity');
    this.saveToCache('/api/english/weekly-activity', data);
    return data;
  }

  async logEnglishSession(data: {
    minutes: number;
    category?: 'speaking' | 'interview' | 'presentation' | 'vocabulary' | 'grammar';
    title?: string;
    notes?: string;
    date?: string;
  }): Promise<{ session: EnglishPracticeSession; weeklyActivity: EnglishWeeklyActivity }> {
    return this.request<{ session: EnglishPracticeSession; weeklyActivity: EnglishWeeklyActivity }>('/api/english/session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Chat ---
  async getChatSessions(): Promise<ChatSessionSummary[]> {
    return this.request<ChatSessionSummary[]>('/api/chat/sessions');
  }

  async getChatSession(sessionId?: string): Promise<ChatSession> {
    const url = sessionId ? `/api/chat?sessionId=${encodeURIComponent(sessionId)}` : '/api/chat';
    const session = await this.request<ChatSession>(url);
    if (!sessionId) {
      this.saveToCache('/api/chat', session);
    }
    return session;
  }

  async createNewChatSession(mode: string = 'life', isVentMode: boolean = false, title?: string): Promise<ChatSession> {
    return this.request<ChatSession>('/api/chat/session/new', {
      method: 'POST',
      body: JSON.stringify({ mode, isVentMode, title }),
    });
  }

  async deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/chat/session/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  }

  async sendChatMessage(
    message: string,
    mode?: string,
    action_type?: string,
    ventMode?: boolean,
    sessionId?: string
  ): Promise<{ userMessage: any; assistantMessage: any; session?: ChatSession }> {
    return this.request<{ userMessage: any; assistantMessage: any; session?: ChatSession }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, mode, action_type, ventMode, sessionId }),
    });
  }

  async clearChatHistory(sessionId?: string): Promise<{ success: boolean }> {
    const url = sessionId ? `/api/chat/history?sessionId=${encodeURIComponent(sessionId)}` : '/api/chat/history';
    return this.request<{ success: boolean }>(url, {
      method: 'DELETE',
    });
  }

  // --- Stats ---
  async getStats(): Promise<UserStats> {
    const stats = await this.request<UserStats>('/api/stats');
    this.saveToCache('/api/stats', stats);
    return stats;
  }

  // --- Daily Growth Streak & Badges ---
  async getStreak(): Promise<DailyGrowthStreak> {
    return this.request<DailyGrowthStreak>('/api/streak');
  }

  async simulateBreakStreak(): Promise<DailyGrowthStreak> {
    return this.request<DailyGrowthStreak>('/api/streak/simulate-break', {
      method: 'POST',
    });
  }

  async restoreDemoStreak(): Promise<DailyGrowthStreak> {
    return this.request<DailyGrowthStreak>('/api/streak/restore-demo', {
      method: 'POST',
    });
  }

  async getBadges(): Promise<Badge[]> {
    const badges = await this.request<Badge[]>('/api/badges');
    this.saveToCache('/api/badges', badges);
    return badges;
  }

  // --- Privacy & Resets ---
  async clearJournal(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/privacy/clear-journal', {
      method: 'DELETE',
    });
  }

  async deleteAccount(): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>('/api/privacy/delete-account', {
      method: 'DELETE',
    });
    this.logout();
    return res;
  }

  async resetDemoData(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/privacy/reset-demo', {
      method: 'POST',
    });
  }

  async getAIStatus(): Promise<{ available: boolean; model: string }> {
    return this.request<{ available: boolean; model: string }>('/api/ai/status');
  }
}

export const api = new ApiClient();
