import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareQuote,
  Mic,
  MicOff,
  Volume2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Award,
  ChevronRight,
  Clock,
  Send,
  AlertCircle,
  Play,
  RotateCcw,
  Briefcase,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EnglishEvaluation, EnglishProgress } from '../../types';
import { api } from '../../services/apiClient';

export const PracticeHub: React.FC = () => {
  const { refreshStats } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<
    'speaking' | 'interview' | 'presentation' | 'situational' | 'vocabulary' | 'grammar'
  >('speaking');

  // Speaking Practice States
  const [speakingTopic, setSpeakingTopic] = useState(
    'Describe a project or skill you recently learned and why it matters to you.'
  );
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EnglishEvaluation | null>(null);

  // Vocabulary States
  const [selectedWordIdx, setSelectedWordIdx] = useState(0);
  const [vocabSentence, setVocabSentence] = useState('');
  const [vocabFeedback, setVocabFeedback] = useState<string | null>(null);

  // Grammar States
  const [grammarAnswerIdx, setGrammarAnswerIdx] = useState<number | null>(null);
  const [selectedGrammarIdx, setSelectedGrammarIdx] = useState(0);

  // Presentation Practice States
  const [presentationTopic, setPresentationTopic] = useState('Why failure is just raw data for growth');
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerActive, setTimerActive] = useState(false);

  // Interview Practice States
  const [interviewRole, setInterviewRole] = useState('Software Engineer & Campus Placement');
  const [interviewData, setInterviewData] = useState({
    question: 'Tell me about a time you worked on a team project with a tight deadline. How did you resolve disagreements?',
    tips: [
      'Use the STAR Method: Situation, Task, Action, Result',
      'Focus on YOUR specific leadership or problem-solving contribution',
      'Keep the outcome positive and quantifiable',
    ],
    framework: 'STAR Method (Situation, Task, Action, Result)',
  });
  const [interviewAnswer, setInterviewAnswer] = useState('');

  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');

  // 1. Speech Recognition Setup with stream handling and zero duplication
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech-to-text is not supported in this browser. You can type your response directly in the box below!');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Capture whatever text was in the box before recording started
      baseTextRef.current = userInput;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onresult = (event: any) => {
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript;
        }

        const cleanSpoken = sessionTranscript.trim();
        const base = baseTextRef.current.trim();
        if (cleanSpoken) {
          setUserInput(base ? `${base} ${cleanSpoken}` : cleanSpoken);
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Clean up mic on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleEvaluateSpeaking = async (mode: 'speaking' | 'interview' | 'situational' = 'speaking') => {
    if (!userInput.trim() || evaluating) return;
    setEvaluating(true);
    setEvaluation(null);

    try {
      const res = await api.evaluateEnglish({
        userInput: userInput.trim(),
        topic: activeSubTab === 'interview' ? interviewData.question : speakingTopic,
        mode,
      });
      setEvaluation(res.evaluation);
      refreshStats();
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  // Timer Effect for 2-Minute Presentation
  React.useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  // Vocabulary Bank
  const vocabList = [
    {
      word: 'Articulate',
      type: 'Verb / Adjective',
      meaning: 'To express an idea or feeling fluently and coherently.',
      example: 'She was able to articulate the project vision clearly to the client.',
      similar: ['Express', 'Clarify', 'Enunciate'],
      challenge: 'Write a sentence using "articulate" to describe a student presenting.',
    },
    {
      word: 'Resilience',
      type: 'Noun',
      meaning: 'The capacity to withstand or recover quickly from difficulties; mental toughness.',
      example: 'His resilience after receiving critical feedback helped him refine the paper.',
      similar: ['Fortitude', 'Perseverance', 'Adaptability'],
      challenge: 'Write a sentence using "resilience" about overcoming exam stress.',
    },
    {
      word: 'Cohesive',
      type: 'Adjective',
      meaning: 'Characterized by being united or forming a unified whole.',
      example: 'The team worked together to present a cohesive marketing proposal.',
      similar: ['Unified', 'Connected', 'Consistent'],
      challenge: 'Write a sentence describing a cohesive study group or report.',
    },
    {
      word: 'Pragmatic',
      type: 'Adjective',
      meaning: 'Dealing with things sensibly and realistically based on practical rather than theoretical considerations.',
      example: 'They adopted a pragmatic approach to meet the tight semester deadline.',
      similar: ['Practical', 'Realistic', 'Sensible'],
      challenge: 'Use "pragmatic" to explain a choice between two study schedules.',
    },
  ];

  // Grammar Rules & Quiz
  const grammarRules = [
    {
      title: 'Past Simple vs. Present Perfect',
      incorrect: 'I have graduated from college last year.',
      correct: 'I graduated from college last year.',
      explanation: 'Use the simple past ("graduated") when referring to a specific completed time in the past ("last year"). Use present perfect ("have graduated") for experiences without a specific past timestamp.',
      quizQuestion: 'Which sentence is grammatically correct for a past completed date?',
      options: [
        'I have submitted my assignment yesterday.',
        'I submitted my assignment yesterday.',
        'I was submitting my assignment yesterday.',
      ],
      correctIdx: 1,
    },
    {
      title: 'Subject-Verb Agreement with "Each" & "Every"',
      incorrect: 'Each of the participants have received a certificate.',
      correct: 'Each of the participants has received a certificate.',
      explanation: '"Each" and "Every" are grammatically singular pronouns. Even though "participants" is plural, the subject is "Each", which takes the singular verb "has".',
      quizQuestion: 'Select the correct sentence:',
      options: [
        'Every student in the laboratory were attentive.',
        'Every student in the laboratory was attentive.',
        'Every students in the laboratory was attentive.',
      ],
      correctIdx: 1,
    },
    {
      title: 'Prepositions: Good At vs. Good In',
      incorrect: 'She is very good in public speaking and mathematics.',
      correct: 'She is very good at public speaking and mathematics.',
      explanation: 'Use "good at" when referring to skills, activities, or abilities (e.g., "good at coding", "good at English"). Use "good in" only for physical containers or specific internal states.',
      quizQuestion: 'Select the natural phrasing:',
      options: [
        'I am getting much better at impromptu debates.',
        'I am getting much better in impromptu debates.',
        'I am getting much better on impromptu debates.',
      ],
      correctIdx: 0,
    },
  ];

  // Situational English Scenarios
  const situationalScenarios = [
    {
      title: 'Speaking to a Professor in Office Hours',
      context: 'You want to ask for guidance on your term project without sounding unprepared.',
      keyPhrases: [
        '"Thank you for your time, Professor. I’ve started drafting section two, but I wanted your advice on..."',
        '"Could you help me clarify the expectations for the literature review?"',
        '"I reviewed the feedback and had one quick question regarding the methodology."',
      ],
      samplePrompt: 'Practice what you would say to your professor if you need a 2-day extension due to an interview.',
    },
    {
      title: 'Contributing to a Group Discussion (GD)',
      context: 'Someone has been speaking continuously, and you want to respectfully enter the conversation.',
      keyPhrases: [
        '"That is a great point, Alex. Building upon what you just noted..."',
        '"I agree with that perspective, and I’d also like to highlight another aspect..."',
        '"While that holds true in many cases, what happens if we look at it from the student’s point of view?"',
      ],
      samplePrompt: 'Practice offering a respectful counterpoint in a college campus debate.',
    },
    {
      title: 'Connecting at a Campus Job Fair',
      context: 'Approaching a recruiter booth to introduce yourself professionally.',
      keyPhrases: [
        '"Hello, my name is [Name], and I’m a third-year computer science student interested in your summer internship program."',
        '"I read about your recent project on sustainable cloud infrastructure, and I’d love to learn more about the team’s work."',
      ],
      samplePrompt: 'Practice giving your 30-second elevator pitch to an internship hiring manager.',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-stone-900">English Practice Hub</h1>
            <p className="text-xs text-stone-500">"Practice English without fear of making mistakes."</p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-4 border-t border-stone-100">
          {[
            { id: 'speaking', label: 'Speaking Practice' },
            { id: 'interview', label: 'Placement Interview' },
            { id: 'presentation', label: '2-Min Presentation' },
            { id: 'situational', label: 'Real Situations' },
            { id: 'vocabulary', label: 'Vocabulary' },
            { id: 'grammar', label: 'Grammar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setEvaluation(null);
                setUserInput('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. SPEAKING PRACTICE VIEW */}
      {activeSubTab === 'speaking' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200">
                  Topic Prompt
                </span>
                <h3 className="font-heading text-base font-bold text-stone-900 mt-2">
                  {speakingTopic}
                </h3>
              </div>
              <button
                onClick={() => {
                  const topics = [
                    'Describe a challenge you faced during a semester project and how you solved it.',
                    'If you could teach anyone one skill, what would it be and why?',
                    'Explain a concept you find fascinating to someone who has never heard of it.',
                    'Describe your ideal workday two years after graduating college.',
                    'How do you handle disagreements when working in a group project?',
                  ];
                  setSpeakingTopic(topics[Math.floor(Math.random() * topics.length)]);
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 shrink-0 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Topic</span>
              </button>
            </div>

            {/* Input & Speech-to-Text */}
            <div className="relative">
              <textarea
                rows={4}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Speak using the microphone or type your response here in English. Do not worry about mistakes—that is what we are here for!"
                className="w-full p-4 pb-12 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all leading-relaxed"
              />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Listening... (Tap to finish)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Speak with Mic</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={evaluating || !userInput.trim()}
                  onClick={() => handleEvaluateSpeaking('speaking')}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40"
                >
                  {evaluating ? 'Analyzing...' : 'Get AI Feedback'}
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Evaluation Result Card */}
          {evaluation && (
            <div className="bg-white p-6 rounded-3xl border border-teal-200 shadow-md space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    AI Communication Analysis
                  </span>
                  <h3 className="font-heading text-lg font-bold text-stone-900">
                    Constructive Feedback
                  </h3>
                </div>
                <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-2xl border border-teal-200">
                  <Award className="w-5 h-5 text-teal-700" />
                  <div>
                    <span className="text-xs text-stone-500 font-medium">Overall Score</span>
                    <p className="text-sm font-bold text-teal-900">{evaluation.overallScore}/100</p>
                  </div>
                </div>
              </div>

              {/* 4 Score Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase">Grammar</span>
                  <p className="text-base font-bold text-stone-900 mt-0.5">{evaluation.grammarScore}%</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase">Vocabulary</span>
                  <p className="text-base font-bold text-stone-900 mt-0.5">{evaluation.vocabularyScore}%</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase">Fluency</span>
                  <p className="text-base font-bold text-stone-900 mt-0.5">{evaluation.fluencyScore}%</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase">Confidence</span>
                  <p className="text-base font-bold text-stone-900 mt-0.5">{evaluation.confidenceScore}%</p>
                </div>
              </div>

              {/* Your Sentence vs Better Version */}
              <div className="space-y-3">
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                    <span>Your Sentence</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 italic">"{evaluation.yourSentence}"</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1">
                    <span>Polished / More Natural Version</span>
                    <button
                      onClick={() => speakText(evaluation.betterVersion)}
                      className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear Pronunciation</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
                    "{evaluation.betterVersion}"
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs leading-relaxed text-stone-700">
                  <span className="font-bold text-stone-900 block mb-1">Why this helps:</span>
                  {evaluation.explanation}
                </div>
              </div>

              {/* Encouragement & Key Takeaways */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                <p className="text-xs text-teal-950 font-semibold mb-2">🌟 {evaluation.positiveFeedback}</p>
                <div className="space-y-1">
                  {evaluation.keyTakeaways.map((tip, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PLACEMENT INTERVIEW PRACTICE VIEW */}
      {activeSubTab === 'interview' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                Campus Placement & Internship Prep
              </span>
              <h3 className="font-heading text-lg font-bold text-stone-900 mt-2">
                {interviewData.question}
              </h3>
            </div>
            <button
              onClick={async () => {
                const q = await api.getInterviewQuestion(interviewRole);
                setInterviewData(q);
              }}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Next Question</span>
            </button>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-900 block mb-1">
              Recommended Framework: {interviewData.framework}
            </span>
            <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
              {interviewData.tips.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Draft your answer using Situation, Task, Action & Result:
              </label>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'Listening...' : 'Speak Answer'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g. During my third-semester database project, our team had three days left when our API failed..."
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
            />
          </div>

          <button
            onClick={() => handleEvaluateSpeaking('interview')}
            disabled={evaluating || !userInput.trim()}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40"
          >
            {evaluating ? 'Analyzing Interview Response...' : 'Review My Answer with STAR Analysis'}
          </button>

          {evaluation && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <span className="font-bold text-emerald-950">Interview Coach Evaluation:</span>
              <p className="text-stone-800 leading-relaxed">{evaluation.explanation}</p>
              <div className="pt-2 border-t border-emerald-200 font-semibold text-emerald-900">
                Better phrasing: "{evaluation.betterVersion}"
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PRESENTATION PRACTICE (2-MIN TIMER) */}
      {activeSubTab === 'presentation' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                Public Speaking Coach
              </span>
              <h3 className="font-heading text-lg font-bold text-stone-900 mt-2">
                Topic: "{presentationTopic}"
              </h3>
            </div>
            <button
              onClick={() => {
                const pTopics = [
                  'Why learning how to learn is the most important skill in college',
                  'The power of 15 minutes of uninterrupted daily focus',
                  'Why failure is simply raw data for your next iteration',
                  'How to build genuine professional relationships as a student',
                ];
                setPresentationTopic(pTopics[Math.floor(Math.random() * pTopics.length)]);
              }}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 shrink-0"
            >
              Change Topic
            </button>
          </div>

          {/* Structure guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">1. The Hook (0:00 - 0:20)</span>
              <p className="text-stone-600">Start with a surprising stat, quick question, or brief personal story.</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">2. Core Points (0:20 - 1:40)</span>
              <p className="text-stone-600">Deliver two clear, concrete examples or principles.</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">3. The Takeaway (1:40 - 2:00)</span>
              <p className="text-stone-600">End with one single memorable sentence the audience should remember.</p>
            </div>
          </div>

          {/* Interactive Countdown Timer */}
          <div className="p-6 bg-stone-900 text-white rounded-3xl text-center">
            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Practice Countdown</span>
            <div className="font-mono text-4xl sm:text-5xl font-extrabold my-2 text-emerald-400">
              {Math.floor(timerSeconds / 60)}:
              {(timerSeconds % 60).toString().padStart(2, '0')}
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  timerActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-stone-950'
                }`}
              >
                {timerActive ? 'Pause Timer' : 'Start Speaking'}
              </button>

              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimerSeconds(120);
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
              >
                Reset (2m)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SITUATIONAL REAL ENGLISH */}
      {activeSubTab === 'situational' && (
        <div className="space-y-4">
          {situationalScenarios.map((scenario, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-800">
                <GraduationCap className="w-4 h-4" />
                <h4 className="font-heading font-bold text-sm text-stone-900">{scenario.title}</h4>
              </div>
              <p className="text-xs text-stone-600">{scenario.context}</p>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <span className="text-[11px] font-bold text-stone-800 block">Natural Phrasing Examples:</span>
                {scenario.keyPhrases.map((phrase, pIdx) => (
                  <p key={pIdx} className="text-xs text-stone-700 italic">
                    • {phrase}
                  </p>
                ))}
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">{scenario.samplePrompt}</span>
                <button
                  onClick={() => {
                    setActiveSubTab('speaking');
                    setSpeakingTopic(scenario.samplePrompt);
                  }}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition-colors"
                >
                  Practice This
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. VOCABULARY BANK */}
      {activeSubTab === 'vocabulary' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Academic & Professional Vocabulary
              </span>
              <h3 className="font-heading text-lg font-bold text-stone-900 mt-1">Word of the Day</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {vocabList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedWordIdx(i);
                    setVocabSentence('');
                    setVocabFeedback(null);
                  }}
                  className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                    selectedWordIdx === i ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Current Word Details */}
          {(() => {
            const wordObj = vocabList[selectedWordIdx];
            return (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-2xl font-extrabold text-teal-950">{wordObj.word}</h4>
                      <span className="text-xs px-2 py-0.5 bg-teal-200 text-teal-900 rounded-md font-medium">
                        {wordObj.type}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                      <strong>Meaning:</strong> {wordObj.meaning}
                    </p>
                    <p className="text-xs text-stone-600 italic mt-1.5">
                      <strong>Example:</strong> "{wordObj.example}"
                    </p>
                  </div>
                  <button
                    onClick={() => speakText(`${wordObj.word}. ${wordObj.meaning}`)}
                    className="p-2 text-teal-800 hover:text-teal-950 bg-white rounded-xl shadow-xs"
                    title="Pronounce"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-xs font-bold text-stone-800 block mb-1">
                    Practice Challenge: {wordObj.challenge}
                  </span>
                  <input
                    type="text"
                    value={vocabSentence}
                    onChange={(e) => setVocabSentence(e.target.value)}
                    placeholder={`Write a sentence using the word "${wordObj.word}"...`}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                  <button
                    onClick={() => {
                      if (!vocabSentence.trim()) return;
                      const hasWord = vocabSentence.toLowerCase().includes(wordObj.word.toLowerCase());
                      if (!hasWord) {
                        setVocabFeedback(`Make sure to include the exact word "${wordObj.word}" in your sentence!`);
                      } else {
                        setVocabFeedback(`Excellent usage! Your sentence is well articulated.`);
                      }
                    }}
                    className="mt-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl"
                  >
                    Check My Sentence
                  </button>
                  {vocabFeedback && (
                    <p className="mt-2 text-xs font-medium text-emerald-800 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      {vocabFeedback}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. GRAMMAR HELPER */}
      {activeSubTab === 'grammar' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Common Student Mistakes
              </span>
              <h3 className="font-heading text-lg font-bold text-stone-900 mt-1">
                Grammar Clarity & Flashcards
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {grammarRules.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedGrammarIdx(i);
                    setGrammarAnswerIdx(null);
                  }}
                  className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                    selectedGrammarIdx === i ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const rule = grammarRules[selectedGrammarIdx];
            return (
              <div className="space-y-4">
                <h4 className="font-heading font-bold text-base text-stone-900">{rule.title}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs">
                    <span className="font-bold text-rose-800 block mb-1">❌ Common Mistake</span>
                    <p className="text-rose-950 italic">"{rule.incorrect}"</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-800 block mb-1">✓ Correct & Natural</span>
                    <p className="text-emerald-950 font-medium">"{rule.correct}"</p>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs leading-relaxed text-stone-700">
                  <span className="font-bold text-stone-900 block mb-1">Rule Explanation:</span>
                  {rule.explanation}
                </div>

                {/* Quick Quiz Check */}
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-3">
                  <span className="text-xs font-bold text-teal-950 block">Quick Check: {rule.quizQuestion}</span>
                  <div className="space-y-2">
                    {rule.options.map((opt, oIdx) => {
                      const isSelected = grammarAnswerIdx === oIdx;
                      const isCorrect = oIdx === rule.correctIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => setGrammarAnswerIdx(oIdx)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-medium border transition-all ${
                            grammarAnswerIdx === null
                              ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                              : isCorrect
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                              : isSelected
                              ? 'bg-rose-100 border-rose-300 text-rose-950'
                              : 'bg-white opacity-50 border-stone-200 text-stone-600'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {grammarAnswerIdx !== null && (
                    <p className="text-xs font-semibold text-teal-900">
                      {grammarAnswerIdx === rule.correctIdx
                        ? '🎉 Spot on! You understand the rule.'
                        : 'Review the rule explanation above and try another topic!'}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
