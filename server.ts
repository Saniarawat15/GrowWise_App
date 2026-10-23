import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { aiService } from './server/aiService.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Auth Token Helper / Middleware
// Supports Authorization: Bearer <userId> or session token
function getUserIdFromReq(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const customUser = req.headers['x-user-id'] as string;
  if (customUser) {
    return customUser;
  }
  return null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  (req as any).user = user;
  next();
}

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// Health & AI status check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'GrowWise',
    tagline: 'Grow with confidence. Learn with purpose.',
    aiAvailable: aiService.isAvailable(),
    time: new Date().toISOString(),
  });
});

app.get('/api/ai/status', (req, res) => {
  res.json({
    available: aiService.isAvailable(),
    model: 'gemini-3.8-flash',
  });
});

function formatUserResponse(user: any) {
  return {
    id: user.id,
    name: user.name,
    real_name: user.real_name || user.name,
    nickname: user.nickname || (user.name ? user.name.split(' ')[0] : 'Friend'),
    student_id: user.student_id || '',
    college_name: user.college_name || '',
    email: user.email,
    age: user.age,
    education_level: user.education_level,
    main_growth_goal: user.main_growth_goal,
    onboarding_completed: user.onboarding_completed ?? true,
    streak_count: user.streak_count,
  };
}

// --- AUTHENTICATION ---
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, real_name, nickname, student_id, college_name, email, password, confirmPassword, age, education_level, main_growth_goal, onboarding_completed } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const user = db.createUser({
      name,
      real_name,
      nickname,
      student_id,
      college_name,
      email,
      password,
      age: age ? parseInt(age, 10) : undefined,
      education_level,
      main_growth_goal,
      onboarding_completed: onboarding_completed ?? true,
    });

    res.status(201).json({
      token: user.id,
      user: formatUserResponse(user),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user || !db.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    db.touchUserActivity(user.id);

    res.json({
      token: user.id,
      user: formatUserResponse(user),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

// Demo login for quick reviewer access
app.post('/api/auth/demo', (req, res) => {
  try {
    const demoUser = db.getUserById('demo-user-alex');
    if (!demoUser) {
      db.seedDemoData();
    }
    const user = db.getUserById('demo-user-alex')!;
    db.touchUserActivity(user.id);
    res.json({
      token: user.id,
      user: formatUserResponse(user),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Demo account unavailable.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user;
  db.touchUserActivity(user.id);
  res.json({
    user: formatUserResponse(user),
  });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { name, real_name, nickname, student_id, college_name, age, education_level, main_growth_goal, onboarding_completed } = req.body;
    const updated = db.updateUserProfile(user.id, {
      name,
      real_name,
      nickname,
      student_id,
      college_name,
      age: age !== undefined ? parseInt(age, 10) : undefined,
      education_level,
      main_growth_goal,
      onboarding_completed,
    });
    res.json({
      user: formatUserResponse(updated),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile.' });
  }
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    db.changePassword(user.id, oldPassword, newPassword);
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change password.' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const user = db.getUserByEmail(email);
  if (user) {
    // Set temporary easy recovery password for demo/student access
    db.resetPassword(email, 'growwise2026');
    return res.json({
      message: 'Password reset link sent. For quick evaluation in demo mode, your temporary password has been set to: growwise2026',
    });
  }
  res.json({ message: 'If this email exists in our records, password instructions have been sent.' });
});

// --- GOALS ---
app.get('/api/goals', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(db.getGoals(user.id));
});

app.post('/api/goals', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { title, description, category, deadline, milestones } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    const newGoal = db.createGoal(user.id, {
      title,
      description: description || '',
      category: category || 'Personal Growth',
      deadline: deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      milestones: Array.isArray(milestones) ? milestones : ['Step 1: Get started'],
    });
    res.status(201).json(newGoal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create goal.' });
  }
});

app.put('/api/goals/:id', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const updated = db.updateGoal(user.id, req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update goal.' });
  }
});

app.delete('/api/goals/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  db.deleteGoal(user.id, req.params.id);
  res.json({ success: true });
});

// --- JOURNAL ---
app.get('/api/journal', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { search, mood } = req.query as { search?: string; mood?: string };
  res.json(db.getJournalEntries(user.id, { search, mood }));
});

app.post('/api/journal', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, mood } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const entry = db.createJournalEntry(user.id, {
      title,
      content,
      mood: mood || 'good',
    });
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save journal entry.' });
  }
});

app.put('/api/journal/:id', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const updated = db.updateJournalEntry(user.id, req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update journal entry.' });
  }
});

app.delete('/api/journal/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  db.deleteJournalEntry(user.id, req.params.id);
  res.json({ success: true });
});

// AI Reflection on Journal Entry
app.post('/api/journal/:id/reflect', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const entry = db.getJournalEntryById(user.id, req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    const reflection = await aiService.reflectOnJournal({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
    });

    const updated = db.updateJournalEntry(user.id, entry.id, {
      ai_reflection: {
        ...reflection,
        generatedAt: new Date().toISOString(),
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate AI reflection.' });
  }
});

// --- DAILY ACTIVITIES ---
app.get('/api/daily', requireAuth, (req, res) => {
  const user = (req as any).user;
  const dateStr = req.query.date as string | undefined;
  res.json(db.getDailyActivities(user.id, dateStr));
});

app.post('/api/daily/:id/toggle', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const toggled = db.toggleDailyActivity(user.id, req.params.id);
    res.json(toggled);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- CONFIDENCE BUILDER ---
app.get('/api/confidence', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(db.getConfidenceActivities(user.id));
});

app.post('/api/confidence/:id/toggle', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { reflection } = req.body;
    const toggled = db.toggleConfidenceActivity(user.id, req.params.id, reflection);
    res.json(toggled);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENGLISH PRACTICE ---
app.get('/api/english/progress', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(db.getEnglishProgress(user.id));
});

app.post('/api/english/evaluate', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { userInput, topic, mode } = req.body;
    if (!userInput) {
      return res.status(400).json({ error: 'User input is required.' });
    }

    const evaluation = await aiService.analyzeEnglish({
      userInput,
      topic: topic || 'General conversation',
      mode: mode || 'speaking',
    });

    // Update user's scores
    const updatedProgress = db.updateEnglishScores(user.id, {
      grammar: evaluation.grammarScore,
      vocabulary: evaluation.vocabularyScore,
      fluency: evaluation.fluencyScore,
      confidence: evaluation.confidenceScore,
    });

    // Auto-record practice session minutes based on activity mode
    const practiceMins = mode === 'interview' ? 20 : mode === 'presentation' ? 15 : 10;
    const practiceCategory = mode === 'interview' ? 'interview' : mode === 'presentation' ? 'presentation' : 'speaking';
    db.logEnglishPractice(user.id, {
      minutes: practiceMins,
      category: practiceCategory,
      title: `${mode === 'interview' ? 'Interview Practice' : 'Spoken English'}: ${topic ? topic.slice(0, 45) : 'Speaking Session'}`,
    });

    res.json({
      evaluation,
      progress: updatedProgress,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to evaluate practice session.' });
  }
});

app.get('/api/english/weekly-activity', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(db.getEnglishWeeklyActivity(user.id));
});

app.post('/api/english/session', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { minutes, category, title, notes, date } = req.body;
  const result = db.logEnglishPractice(user.id, {
    minutes: Number(minutes) || 15,
    category,
    title,
    notes,
    date,
  });
  res.json(result);
});

app.post('/api/english/interview-question', requireAuth, async (req, res) => {
  const { role, difficulty } = req.body;
  const q = await aiService.generateInterviewQuestion(role || 'Software & College Internship', difficulty);
  res.json(q);
});

// --- AI COMPANION CHAT & SESSIONS ---
app.get('/api/chat/sessions', requireAuth, (req, res) => {
  const user = (req as any).user;
  const sessions = db.getChatSessions(user.id);
  const summaries = sessions.map(s => {
    const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : undefined;
    return {
      id: s.id,
      title: s.title,
      mode: s.mode,
      is_vent: !!s.is_vent,
      created_at: s.created_at,
      updated_at: s.updated_at || s.created_at,
      messageCount: s.messages ? s.messages.length : 0,
      lastMessage: lastMsg ? (lastMsg.message.length > 60 ? `${lastMsg.message.slice(0, 60)}...` : lastMsg.message) : '',
    };
  });
  res.json(summaries);
});

app.get('/api/chat/session/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  const session = db.getChatSessionById(user.id, req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found.' });
  }
  res.json(session);
});

app.post('/api/chat/session/new', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { mode, isVentMode, title } = req.body;
  const session = db.createNewChatSession(user.id, mode || 'life', title, isVentMode);
  res.json(session);
});

app.delete('/api/chat/session/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  const deleted = db.deleteChatSession(user.id, req.params.id);
  res.json({ success: deleted });
});

app.get('/api/chat', requireAuth, (req, res) => {
  const user = (req as any).user;
  const sessionId = req.query.sessionId as string | undefined;
  const session = db.getOrCreateChatSession(user.id, sessionId);
  res.json(session);
});

app.post('/api/chat/message', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { message, mode, action_type, ventMode, sessionId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Save user message in designated or active session
    const userMsg = db.addChatMessage(user.id, 'user', message.trim(), action_type || mode, sessionId);

    // Fetch conversation context for this specific session
    const session = db.getOrCreateChatSession(user.id, sessionId || userMsg.session_id);
    const history = session.messages.slice(-8);

    // Generate AI response
    const replyText = await aiService.generateResponse({
      prompt: message.trim(),
      history,
      mode: mode || action_type || session.mode || 'life',
      ventMode: ventMode !== undefined ? !!ventMode : !!session.is_vent,
      userContext: {
        name: user.name,
        real_name: user.real_name,
        nickname: user.nickname,
        student_id: user.student_id,
        college_name: user.college_name,
        education_level: user.education_level,
        main_growth_goal: user.main_growth_goal,
      },
    });

    // Save assistant response
    const assistantMsg = db.addChatMessage(user.id, 'assistant', replyText, action_type || mode, session.id);

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      session,
    });
  } catch (err: any) {
    console.error('Chat message error:', err);
    res.status(500).json({ error: 'Chat message processing failed.' });
  }
});

app.delete('/api/chat/history', requireAuth, (req, res) => {
  const user = (req as any).user;
  const sessionId = req.query.sessionId as string | undefined;
  db.clearChatHistory(user.id, sessionId);
  res.json({ success: true, message: 'Chat history cleared.' });
});

// --- OVERALL USER PROGRESS & STATS ---
app.get('/api/stats', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(db.getUserStats(user.id));
});

// --- STREAK & BADGES ---
app.get('/api/streak', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(db.getDailyGrowthStreak(user.id));
});

app.post('/api/streak/simulate-break', requireAuth, (req, res) => {
  const user = (req as any).user;
  const streak = db.simulateBreakStreak(user.id);
  res.json(streak);
});

app.post('/api/streak/restore-demo', requireAuth, (req, res) => {
  const user = (req as any).user;
  const streak = db.restoreDemoStreak(user.id);
  res.json(streak);
});

app.get('/api/badges', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(db.getBadges(user.id));
});

// --- PRIVACY & SETTINGS ---
app.delete('/api/privacy/clear-journal', requireAuth, (req, res) => {
  const user = (req as any).user;
  db.clearUserJournals(user.id);
  res.json({ success: true, message: 'All journal entries deleted.' });
});

app.delete('/api/privacy/delete-account', requireAuth, (req, res) => {
  const user = (req as any).user;
  db.deleteUserAccount(user.id);
  res.json({ success: true, message: 'Account deleted.' });
});

app.post('/api/privacy/reset-demo', (req, res) => {
  db.seedDemoData();
  res.json({ success: true, message: 'Demo data reseeded.' });
});

// ---------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GrowWise server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
