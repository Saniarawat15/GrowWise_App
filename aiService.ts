import { GoogleGenAI, Type } from '@google/genai';

// System prompt strictly aligned with GrowWise core philosophy
const GROWWISE_SYSTEM_PROMPT = `You are GrowWise, an AI personal growth and communication coach for students and young adults.
Your tagline: "Grow with confidence. Learn with purpose."

Core Principles:
1. Empowerment over Dependency: Your purpose is to help users become more confident, independent, reflective, and capable. You are supportive but NEVER emotionally possessive.
2. Never claim to be human, and never replace real-world relationships. Avoid expressions like "I'm all you need" or "Don't leave me". Regularly encourage healthy real-world connections (friends, professors, counselors, family) when appropriate.
3. Help users think through situations rather than making decisions for them. Ask reflective questions.
4. For emotional situations:
   - Acknowledge the user's feelings with warmth and calm.
   - Help identify what happened.
   - Break down the situation objectively.
   - Suggest practical, small next steps.
   - Encourage real-world support when beneficial.
5. For confidence challenges:
   - Use the 4-step framework: Situation → Thought → Reality → Action.
   - Separate fear from facts, and offer a manageable, immediate micro-action.
6. For English practice:
   - Be kind and constructive. Never mock mistakes.
   - Highlight: "Your sentence", "Better", and "Why".
7. Crisis Safety Rule:
   - You are NOT a doctor, therapist, or emergency service.
   - If the user expresses serious self-harm, suicidal intent, abuse, or immediate danger, do NOT attempt to handle it alone. Immediately provide a calm, caring response urging them to contact local emergency services (911/988 in the US, 112 in EU/India), a university counselor, or a trusted person nearby.

Keep responses concise, clear, and action-oriented. Do not write unnecessarily long essays unless deep analysis was requested.`;

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Models in cascade order per @google/genai guidelines.
// If gemini-3.8-flash experiences temporary demand spikes (503/429), fall back to flash-latest or 3.1-flash-lite.
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

function isTransientError(err: any): boolean {
  if (!err) return false;
  const str = (
    String(err?.message || '') +
    ' ' +
    String(err?.status || '') +
    ' ' +
    JSON.stringify(err?.error || '') +
    ' ' +
    String(err?.code || '')
  ).toLowerCase();

  return (
    str.includes('503') ||
    str.includes('429') ||
    str.includes('unavailable') ||
    str.includes('high demand') ||
    str.includes('spikes in demand') ||
    str.includes('overloaded') ||
    str.includes('resource has been exhausted') ||
    str.includes('rate limit') ||
    str.includes('quota') ||
    str.includes('timeout') ||
    str.includes('deadline exceeded')
  );
}

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const models = params.preferredModel
    ? [params.preferredModel, ...CANDIDATE_MODELS.filter(m => m !== params.preferredModel)]
    : CANDIDATE_MODELS;

  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return res;
    } catch (err: any) {
      lastError = err;
      const transient = isTransientError(err);
      console.warn(`[GrowWise AI] Attempt with model "${model}" failed (transient=${transient}):`, err?.message || err);

      if (i < models.length - 1 && transient) {
        // Wait brief progressive backoff before trying next candidate
        await new Promise(r => setTimeout(r, 350 * (i + 1)));
        continue;
      }
      if (!transient) {
        throw err;
      }
    }
  }

  throw lastError;
}

export interface ChatRequestOptions {
  prompt: string;
  history?: Array<{ sender: 'user' | 'assistant'; message: string }>;
  mode?: string; // 'life' | 'study' | 'english' | 'career' | 'motivation' | 'reflect' | 'confidence' | 'interview'
  ventMode?: boolean; // Safe Vent Mode (pure empathy, active listening, hold space)
  userContext?: {
    name?: string;
    real_name?: string;
    nickname?: string;
    student_id?: string;
    college_name?: string;
    age?: number;
    education_level?: string;
    main_growth_goal?: string;
  };
}

export interface EnglishAnalysisResult {
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

export interface JournalReflectionResult {
  themes: string[];
  emotions: string[];
  patterns: string;
  positiveObservations: string[];
  questionsForReflection: string[];
}

function buildGracefulFallbackResponse(options: ChatRequestOptions, isMentallyTired: boolean): string {
  const preferredName = options.userContext?.nickname || options.userContext?.name?.split(' ')[0] || 'Friend';
  const mode = (options.mode || 'life').toLowerCase();

  if (options.ventMode) {
    return `I hear you, ${preferredName}, and I am holding this space completely for you. Everything you just expressed is completely valid. When feelings pile up or life feels heavy, you don't need to justify anything or have all the answers right now.\n\nTake all the time you need to let your thoughts out. I'm right here listening without judgment.`;
  }

  if (isMentallyTired) {
    return `I hear how mentally tired and drained you are feeling right now, ${preferredName}. When your mind is carrying so much, pushing through only adds friction.\n\nGive yourself permission to pause right here. Let your shoulders drop, unclench your jaw, and take a slow, grounding breath in... and gently let it out.\n\nTip: You can use the guided Breathing Exercise right here in GrowWise whenever you want a 1-minute calming reset with gentle audio and haptic cues.`;
  }

  switch (mode) {
    case 'study':
      return `Thank you for sharing this, ${preferredName}. When study pressure or college deadlines build up, breaking work down into a 15-minute micro-sprint often cuts through the overwhelm.\n\nWhat is one small part of this topic or assignment you could look at for just 5 minutes without pressure?`;

    case 'english':
      return `I appreciate you expressing this, ${preferredName}! You communicated your idea clearly. Consistent daily practice is the secret to fluent speech.\n\nTry reading your sentence aloud once more with a steady, confident pace. How did that feel?`;

    case 'career':
      return `That is a really important thought regarding your growth, ${preferredName}. Building a career or preparing for campus placements happens one deliberate action at a time.\n\nWhat is the single highest-priority step for you right now—polishing a skill, updating a project, or reaching out to a mentor?`;

    case 'motivation':
      return `You've got this, ${preferredName}! Remember why you started and how much you have already learned. Confidence isn't the absence of doubt—it is taking one small step forward despite it.\n\nWhat is one tiny win you can achieve today?`;

    case 'reflect':
    case 'life':
    default:
      return `I hear you, ${preferredName}. It takes courage to step back and reflect on what is happening in your life right now.\n\nLooking at what you just described, what is one small thing that is within your direct control today?`;
  }
}

export const aiService = {
  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  },

  async generateResponse(options: ChatRequestOptions): Promise<string> {
    const lowerPrompt = options.prompt.toLowerCase();
    const isMentallyTired = /\b(mentally tired|tired|exhausted|burnout|burnt out|fatigued|drained|overwhelmed|brain is fried|can't think|cant think|mind is tired|so heavy|stress|stressed|headache from thinking|need a break|need to breathe)\b/i.test(lowerPrompt);

    const ai = getAIClient();
    if (!ai) {
      if (isMentallyTired) {
        return "I hear how mentally exhausted and tired you are feeling right now. When your mind is carrying so much, it is completely natural to feel drained.\n\nYou don't have to push through or solve anything this very minute. Give yourself permission to pause, soften your shoulders, and take a slow, deep breath in... and gently let it out.\n\nTip: You can use the guided Breathing Exercise right here in GrowWise to take a quiet 1-minute reset.";
      }
      return buildGracefulFallbackResponse(options, isMentallyTired);
    }

    // Safety keyword check for immediate crisis response
    const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'cutting myself'];
    if (crisisKeywords.some(kw => lowerPrompt.includes(kw))) {
      return "I hear that you are carrying immense pain right now, and I want you to know that your life has tremendous value. Because I am an AI coach, I cannot provide the crisis care you deserve.\n\nPlease connect immediately with someone who can support you right now:\n• **National Crisis & Suicide Lifeline**: Call or text **988** (US/Canada) or **112** (Europe/India/International)\n• **Crisis Text Line**: Text **HOME** to **741741**\n• Please reach out to a campus counselor, trusted family member, or friend nearby.\n\nYou do not have to carry this alone. Please reach out to them right now.";
    }

    try {
      let modeInstructions = "";
      const normalizedMode = (options.mode || 'life').toLowerCase();

      switch (normalizedMode) {
        case 'life':
          modeInstructions = `Role: LIFE MENTOR.
Style: Grounded, wise, empathetic elder sibling/mentor.
Focus: Life transitions, family expectations, friendship boundaries, emotional balance, and adulting dilemmas.
Guidance: Validate feelings with deep compassion. Help the student zoom out, gain perspective, and recognize that feeling lost at times is a normal part of growing up.`;
          break;

        case 'study':
          modeInstructions = `Role: STUDY MENTOR.
Style: Calm, structured, highly practical academic coach.
Focus: Overcoming procrastination, exam panic, assignment overload, active recall, and Pomodoro pacing.
Guidance: Break overwhelming study tasks into clear 15-minute bite-sized steps. Remind them to breathe and conquer one task at a time without guilt.`;
          break;

        case 'english':
          modeInstructions = `Role: ENGLISH COACH.
Style: Warm, encouraging, non-judgmental spoken and written English partner.
Focus: Conversational confidence, public speaking fluency, interview expression, and vocabulary enhancement.
Guidance: Always validate their message first. When helpful, offer a gentle polish:
'✨ Natural Polish: [better, natural phrasing]'
'💡 Key Tip: [brief, encouraging reason why]'. Celebrate every effort!`;
          break;

        case 'career':
          modeInstructions = `Role: CAREER GUIDE.
Style: Pragmatic, empowering placement advisor and industry mentor.
Focus: Internships, resumes, tackling placement interview anxiety, handling rejection resilience, and the STAR method (Situation, Task, Action, Result).
Guidance: Remind them that career paths are marathons, not sprints. Help highlight their unique student strengths and projects.`;
          break;

        case 'motivation':
          modeInstructions = `Role: MOTIVATION COACH.
Style: Uplifting, high-energy spark, positive accountability partner.
Focus: Breaking analysis paralysis, sparking momentum on low-energy days, and celebrating non-zero days.
Guidance: Give an energizing, compassionate boost! Encourage taking a tiny 2-minute starter step right now.`;
          break;

        case 'reflect':
        default:
          modeInstructions = `Role: REFLECTION COMPANION & SAFE VENT SANCTUARY.
Style: Mindful, patient, deeply active listener.
Focus: Safe emotional venting, psychological reframing (Situation → Thought → Reality → Action), and self-inquiry.
Guidance: Offer a quiet, non-judgmental haven where the user can untangle raw emotions. Ask 1 gentle reflective question.`;
          break;
      }

      if (options.ventMode) {
        modeInstructions += `\n\n⚠️ CRITICAL SAFE VENT INSTRUCTION:
The user has turned ON "Safe Vent Mode (Just Listen & Hold Space)".
- DO NOT lecture, give unsolicited multi-step action plans, or rush to "fix" their problem.
- First and foremost, hold space. Validate their feelings deeply (e.g., "I hear you, and it makes complete sense you feel this way").
- Provide warmth, relief, and reassurance. Let them vent completely without feeling judged or evaluated.`;
      }

      if (isMentallyTired) {
        modeInstructions += `\n\n🌿 MENTAL FATIGUE & TIREDNESS GUIDANCE:
The user is expressing feeling mentally tired, exhausted, overwhelmed, or drained.
- Deeply normalize and validate their mental exhaustion. Do not push them to hustle or immediately conquer huge goals right now.
- Gently suggest taking a 1-minute conscious breathing pause right now with you to release physical and mental tension (e.g. relaxing the shoulders, unclenching the jaw, taking a slow grounding breath).
- Remind them that intentional rest is a foundational part of sustainable growth.`;
      }

      let contextStr = "";
      if (options.userContext) {
        const preferredName = options.userContext.nickname || options.userContext.name || 'Friend';
        const fullName = options.userContext.real_name || options.userContext.name;
        const studentId = options.userContext.student_id;
        const college = options.userContext.college_name;
        const education = options.userContext.education_level || 'College Student';
        const goal = options.userContext.main_growth_goal || 'Personal growth & confidence';

        contextStr = `User Profile Context:
- Preferred Name / Nickname: "${preferredName}" (Address the user naturally by this name!)
${fullName && fullName !== preferredName ? `- Full Real Name: "${fullName}"\n` : ''}${studentId ? `- Student/User ID: "${studentId}"\n` : ''}${college ? `- Institution/College: "${college}"\n` : ''}- Education: ${education}
- Core Growth Goal: "${goal}"\n\n`;
      }

      const conversationHistory = (options.history || [])
        .slice(-6)
        .map(h => `${h.sender === 'user' ? 'User' : 'GrowWise'}: ${h.message}`)
        .join('\n');

      const fullPrompt = `${contextStr}${modeInstructions}\n\nRecent conversation:\n${conversationHistory}\nUser: ${options.prompt}\nGrowWise:`;

      const aiPromise = generateWithFallback(ai, {
        contents: fullPrompt,
        config: {
          systemInstruction: GROWWISE_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 9500)
      );

      const response: any = await Promise.race([aiPromise, timeoutPromise]);

      return response.text?.trim() || buildGracefulFallbackResponse(options, isMentallyTired);
    } catch (err: any) {
      console.warn('[GrowWise AI] Transient service spike, timeout, or demand limit on models, using graceful response:', err?.message || err);
      return buildGracefulFallbackResponse(options, isMentallyTired);
    }
  },

  async analyzeEnglish(data: {
    userInput: string;
    topic: string;
    mode: 'speaking' | 'interview' | 'situational' | 'general';
  }): Promise<EnglishAnalysisResult> {
    const ai = getAIClient();
    if (!ai) {
      return {
        overallScore: 78,
        grammarScore: 75,
        vocabularyScore: 74,
        fluencyScore: 72,
        confidenceScore: 82,
        yourSentence: data.userInput.slice(0, 80),
        betterVersion: data.userInput.slice(0, 80),
        explanation: "Good pacing and clear vocabulary. Practice varying sentence connectors.",
        positiveFeedback: "Great effort expressing your thoughts out loud!",
        keyTakeaways: ["Keep practicing speaking daily", "Take steady breaths between ideas"],
      };
    }

    try {
      // Clean up any duplicated phrases from speech recognition if present
      const cleanedInput = data.userInput
        .replace(/\b(\w+)( \1\b)+/gi, '$1')
        .slice(0, 800)
        .trim();

      const prompt = `Quickly evaluate this student spoken English practice response:
Topic: "${data.topic}"
Student: "${cleanedInput}"
Mode: ${data.mode}

Provide kind, encouraging, and fast constructive feedback in JSON:
- overallScore (0-100)
- grammarScore (0-100)
- vocabularyScore (0-100)
- fluencyScore (0-100)
- confidenceScore (0-100)
- yourSentence: student's key phrase that could be polished
- betterVersion: natural, professional version
- explanation: brief 1-sentence tip
- positiveFeedback: 1 sentence praising effort
- keyTakeaways: 2 short bullet tips`;

      const aiCall = generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an encouraging, fast English communication coach. Analyze the response quickly and concisely.',
          responseMimeType: 'application/json',
          maxOutputTokens: 600,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER },
              grammarScore: { type: Type.INTEGER },
              vocabularyScore: { type: Type.INTEGER },
              fluencyScore: { type: Type.INTEGER },
              confidenceScore: { type: Type.INTEGER },
              yourSentence: { type: Type.STRING },
              betterVersion: { type: Type.STRING },
              explanation: { type: Type.STRING },
              positiveFeedback: { type: Type.STRING },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['overallScore', 'grammarScore', 'vocabularyScore', 'fluencyScore', 'confidenceScore', 'yourSentence', 'betterVersion', 'explanation', 'positiveFeedback', 'keyTakeaways'],
          },
        },
      });

      // 8s timeout safeguard so analysis never hangs
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timeout')), 8000)
      );

      const response: any = await Promise.race([aiCall, timeoutPromise]);

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        overallScore: parsed.overallScore || 78,
        grammarScore: parsed.grammarScore || 76,
        vocabularyScore: parsed.vocabularyScore || 74,
        fluencyScore: parsed.fluencyScore || 72,
        confidenceScore: parsed.confidenceScore || 80,
        yourSentence: parsed.yourSentence || cleanedInput.slice(0, 100),
        betterVersion: parsed.betterVersion || cleanedInput.slice(0, 100),
        explanation: parsed.explanation || "Clear and structured spoken thoughts.",
        positiveFeedback: parsed.positiveFeedback || "Strong initiative! Keep practicing regularly.",
        keyTakeaways: parsed.keyTakeaways || ["Maintain steady speech pacing", "Keep expressing your thoughts in full sentences"],
      };
    } catch (err: any) {
      console.warn('[GrowWise AI] English analysis fallback triggered:', err?.message || err);
      return {
        overallScore: 78,
        grammarScore: 75,
        vocabularyScore: 74,
        fluencyScore: 72,
        confidenceScore: 82,
        yourSentence: data.userInput.slice(0, 80),
        betterVersion: data.userInput.slice(0, 80),
        explanation: "Good pacing and clear vocabulary. Practice varying sentence connectors.",
        positiveFeedback: "Great effort expressing your thoughts out loud!",
        keyTakeaways: ["Keep practicing speaking daily", "Take steady breaths between ideas"],
      };
    }
  },

  async reflectOnJournal(entry: { title: string; content: string; mood: string }): Promise<JournalReflectionResult> {
    const ai = getAIClient();
    if (!ai) {
      return {
        themes: ['Personal reflection', 'Self-awareness'],
        emotions: [entry.mood],
        patterns: 'Writing down your thoughts helps clarify your perspective.',
        positiveObservations: ['You showed honesty in recording how you feel.'],
        questionsForReflection: ['What is one small step you can take today that feels manageable?'],
      };
    }

    try {
      const prompt = `Reflect on this student's journal entry.
Title: "${entry.title}"
Mood indicated: ${entry.mood}
Content:
"${entry.content}"

Instructions:
- Do NOT diagnose any medical or psychological conditions.
- Do NOT make medical claims.
- Identify general themes, possible emotions, patterns, positive observations, and 1-2 thoughtful questions for self-reflection.
Return a JSON object.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: GROWWISE_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              themes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              emotions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              patterns: { type: Type.STRING },
              positiveObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              questionsForReflection: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['themes', 'emotions', 'patterns', 'positiveObservations', 'questionsForReflection'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        themes: parsed.themes || ['Personal growth'],
        emotions: parsed.emotions || [entry.mood],
        patterns: parsed.patterns || 'Taking time to pause and reflect creates clarity.',
        positiveObservations: parsed.positiveObservations || ['You articulated your experience with clarity.'],
        questionsForReflection: parsed.questionsForReflection || ['What did this experience teach you about yourself?'],
      };
    } catch (err: any) {
      console.warn('[GrowWise AI] Journal reflection fallback triggered:', err?.message || err);
      return {
        themes: ['Reflection and self-honesty'],
        emotions: [entry.mood],
        patterns: 'Reflecting on your day helps separate facts from anxious interpretations.',
        positiveObservations: ['You took time out of your busy day to check in with yourself.'],
        questionsForReflection: ['What is one thing that brought you peace today, even briefly?'],
      };
    }
  },

  async generateInterviewQuestion(role: string, difficulty: string = 'entry-level'): Promise<{ question: string; tips: string[]; framework: string }> {
    const ai = getAIClient();
    if (!ai) {
      return {
        question: "Tell me about a time you faced a difficult deadline during a project and how you managed it.",
        tips: ["Use the STAR method: Situation, Task, Action, Result", "Focus on what YOU did rather than just the team"],
        framework: "STAR Method (Situation, Task, Action, Result)",
      };
    }

    try {
      const prompt = `Generate a realistic college campus placement or internship interview question for: Role: ${role}, Level: ${difficulty}.
Return a JSON object with:
- question: the interview question
- tips: array of 2-3 strategic tips for answering
- framework: recommended response structure (e.g. STAR or PREP)`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: GROWWISE_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              framework: { type: Type.STRING },
            },
            required: ['question', 'tips', 'framework'],
          },
        },
      });

      return JSON.parse(response.text?.trim() || '{}');
    } catch (err: any) {
      console.warn('[GrowWise AI] Interview question fallback triggered:', err?.message || err);
      return {
        question: "Describe a situation where you had to communicate complex technical details to someone outside your field.",
        tips: ["Avoid excessive jargon", "Emphasize empathy and clarity"],
        framework: "STAR Method",
      };
    }
  },
};
