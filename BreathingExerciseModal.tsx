import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
  Sparkles,
  CheckCircle2,
  Heart,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export type BreathingTechnique = 'box' | 'relax478' | 'calm46';

interface BreathingPattern {
  id: BreathingTechnique;
  name: string;
  subtitle: string;
  benefit: string;
  phases: Array<{
    name: 'Inhale' | 'Hold' | 'Exhale' | 'Rest';
    duration: number; // in seconds
    instruction: string;
  }>;
}

const TECHNIQUES: Record<BreathingTechnique, BreathingPattern> = {
  box: {
    id: 'box',
    name: 'Box Breathing',
    subtitle: '4 • 4 • 4 • 4',
    benefit: 'Clears mental fog, lowers stress hormones & resets focus',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose' },
      { name: 'Hold', duration: 4, instruction: 'Hold gently without straining' },
      { name: 'Exhale', duration: 4, instruction: 'Release all air softly through your mouth' },
      { name: 'Rest', duration: 4, instruction: 'Pause and feel the stillness' },
    ],
  },
  relax478: {
    id: 'relax478',
    name: '4-7-8 Deep Relaxation',
    subtitle: '4 • 7 • 8',
    benefit: 'Deep parasympathetic reset for mental fatigue, burnout & racing thoughts',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe in smoothly through your nose' },
      { name: 'Hold', duration: 7, instruction: 'Hold comfortably, let your shoulders drop' },
      { name: 'Exhale', duration: 8, instruction: 'Exhale completely with a gentle whoosh sound' },
    ],
  },
  calm46: {
    id: 'calm46',
    name: '4-6 Calming Flow',
    subtitle: '4 • 6 (No breath hold)',
    benefit: 'Gentle, soothing rhythm when you feel too tired for holds',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Inhale softly, expanding your abdomen' },
      { name: 'Exhale', duration: 6, instruction: 'Slowly let the breath drift out' },
    ],
  },
};

const GROUNDING_TIPS = [
  'Drop your shoulders gently away from your ears.',
  'Unclench your jaw and soften the muscles around your eyes.',
  'Let your belly expand naturally — no need to force.',
  'You have nowhere else to be right now. This minute is yours.',
  'Thoughts may wander. Just notice them and return to the breath.',
];

interface BreathingExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTechnique?: BreathingTechnique;
}

export const BreathingExerciseModal: React.FC<BreathingExerciseModalProps> = ({
  isOpen,
  onClose,
  initialTechnique = 'box',
}) => {
  const [technique, setTechnique] = useState<BreathingTechnique>(initialTechnique);
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(TECHNIQUES[initialTechnique].phases[0].duration);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [targetCycles, setTargetCycles] = useState(4); // default ~1-1.5 mins
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentPattern = TECHNIQUES[technique];
  const currentPhase = currentPattern.phases[phaseIndex] || currentPattern.phases[0];

  // Trigger haptic vibration if supported on device
  const triggerVibration = (pattern = [80, 50, 80]) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // Play a crisp crystal "ting" bell sound when a full breathing cycle completes
  const playCycleTing = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5 high crystal tone
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now); // E6 harmonic overtone

      // High crisp "ting" envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    } catch {}
  };

  // Play gentle bell sound on phase transition using Web Audio
  const playPhaseSound = (freq = 528) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Soft bell envelope
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch {
      // Audio not supported or blocked
    }
  };

  // Reset exercise
  const handleReset = (newTech = technique) => {
    setIsActive(false);
    setTechnique(newTech);
    setPhaseIndex(0);
    setSecondsRemaining(TECHNIQUES[newTech].phases[0].duration);
    setCompletedCycles(0);
    setIsCompleted(false);
  };

  // Switch technique
  const handleSelectTechnique = (t: BreathingTechnique) => {
    handleReset(t);
  };

  // Toggle start / pause
  const togglePlay = () => {
    if (isCompleted) {
      handleReset(technique);
      setIsActive(true);
      return;
    }
    if (!isActive) {
      playPhaseSound(528);
      triggerVibration([50]);
    }
    setIsActive((prev) => !prev);
  };

  // Timer loop
  useEffect(() => {
    if (!isOpen || !isActive || isCompleted) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Advance to next phase
        const nextIndex = (phaseIndex + 1) % currentPattern.phases.length;
        const isCycleEnd = nextIndex === 0;

        if (isCycleEnd) {
          const newCycleCount = completedCycles + 1;
          setCompletedCycles(newCycleCount);
          setTipIndex((t) => (t + 1) % GROUNDING_TIPS.length);

          // Ting sound and vibration after each cycle
          playCycleTing();
          triggerVibration([100, 60, 100]);

          if (targetCycles > 0 && newCycleCount >= targetCycles) {
            setIsActive(false);
            setIsCompleted(true);
            return 0;
          }
        }

        setPhaseIndex(nextIndex);
        const nextPhase = currentPattern.phases[nextIndex];

        // Sound cues by phase
        if (!isCycleEnd) {
          if (nextPhase.name === 'Inhale') playPhaseSound(528);
          else if (nextPhase.name === 'Hold') playPhaseSound(440);
          else if (nextPhase.name === 'Exhale') playPhaseSound(396);
          else playPhaseSound(352);
          triggerVibration([30]);
        }

        return nextPhase.duration;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isActive, phaseIndex, currentPattern, completedCycles, targetCycles, isCompleted]);

  // Compute visual circle scale based on phase
  const getCircleScale = () => {
    if (isCompleted) return 1.1;
    if (!isActive) return 1.0;

    const totalDuration = currentPhase.duration;
    const elapsed = totalDuration - secondsRemaining;
    const progress = Math.min(1, Math.max(0, elapsed / totalDuration));

    if (currentPhase.name === 'Inhale') {
      // Scale from 0.85 up to 1.35
      return 0.85 + 0.5 * progress;
    } else if (currentPhase.name === 'Hold') {
      return 1.35;
    } else if (currentPhase.name === 'Exhale') {
      // Scale from 1.35 down to 0.85
      return 1.35 - 0.5 * progress;
    } else {
      // Rest
      return 0.85;
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase.name) {
      case 'Inhale':
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-400',
          ring: 'ring-emerald-400/30',
          text: 'text-emerald-300',
          accent: 'from-emerald-500 to-teal-400',
        };
      case 'Hold':
        return {
          bg: 'bg-sky-500/20',
          border: 'border-sky-400',
          ring: 'ring-sky-400/30',
          text: 'text-sky-300',
          accent: 'from-sky-500 to-indigo-400',
        };
      case 'Exhale':
        return {
          bg: 'bg-teal-500/20',
          border: 'border-teal-400',
          ring: 'ring-teal-400/30',
          text: 'text-teal-300',
          accent: 'from-teal-500 to-emerald-400',
        };
      case 'Rest':
      default:
        return {
          bg: 'bg-stone-500/20',
          border: 'border-stone-400',
          ring: 'ring-stone-400/30',
          text: 'text-stone-300',
          accent: 'from-stone-500 to-stone-400',
        };
    }
  };

  if (!isOpen) return null;

  const phaseColors = getPhaseColor();

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Mindful Breathing Pause</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  Mental Reset
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Ground your nervous system & release mental exhaustion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              title={soundEnabled ? 'Mute chimes' : 'Unmute chimes'}
              aria-label={soundEnabled ? 'Mute chimes' : 'Unmute chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              aria-label="Close breathing exercise"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Technique Switcher */}
        <div className="px-4 pt-3 pb-2 bg-stone-900/50 border-b border-stone-800/80">
          <div className="grid grid-cols-3 gap-2">
            {(['box', 'relax478', 'calm46'] as BreathingTechnique[]).map((tId) => {
              const item = TECHNIQUES[tId];
              const isSel = technique === tId;
              return (
                <button
                  key={tId}
                  onClick={() => handleSelectTechnique(tId)}
                  className={`p-2 sm:p-2.5 rounded-2xl text-left border transition-all ${
                    isSel
                      ? 'bg-teal-950/70 border-teal-500 text-teal-100 shadow-xs'
                      : 'bg-stone-800/50 border-stone-700/60 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{item.name}</span>
                    <span className="text-[10px] text-teal-400/80 font-mono hidden sm:inline">{item.subtitle}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">
                    {item.benefit.split('&')[0]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Canvas / Breathing Circle */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center text-center relative min-h-[320px]">
          {isCompleted ? (
            <div className="py-6 space-y-4 max-w-sm animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white">
                Mindful Reset Completed
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                You took <strong>{completedCycles} cycles</strong> of conscious breath. Your heart rate and nervous system have had a chance to gently settle.
              </p>
              <div className="p-3.5 bg-stone-800/80 border border-stone-700 rounded-2xl text-xs text-stone-300 text-left space-y-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" /> Gentle Reminder
                </span>
                <p>
                  Mental tiredness is a cue to pace yourself. Drink a glass of water, soften your shoulders, and tackle whatever comes next one simple step at a time.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleReset(technique)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Breathe Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Return to GrowWise
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center">
              {/* Dynamic Animated Circle */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-3">
                {/* Outer Ambient Glow Ring */}
                <div
                  className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 ${
                    isActive ? phaseColors.bg : 'bg-transparent'
                  }`}
                />

                {/* Animated Expanding/Contracting Circle (clickable) */}
                <div
                  onClick={togglePlay}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && togglePlay()}
                  title={isActive ? 'Click to pause' : 'Click to start breathing'}
                  className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 transition-transform duration-1000 ease-in-out flex flex-col items-center justify-center shadow-2xl relative cursor-pointer select-none ${phaseColors.border} ${phaseColors.bg}`}
                  style={{
                    transform: `scale(${getCircleScale()})`,
                  }}
                >
                  {/* Subtle inner pulse ring */}
                  <div className="absolute inset-2 rounded-full border border-white/10 pointer-events-none" />

                  {/* Phase Title & Seconds OR Prominent Start Button */}
                  <div className="relative z-10 space-y-1 flex flex-col items-center justify-center p-3">
                    {isActive ? (
                      <>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-300">
                          {currentPhase.name}
                        </span>
                        <div className={`text-5xl sm:text-6xl font-extrabold font-mono tracking-tight ${phaseColors.text}`}>
                          {secondsRemaining}
                        </div>
                        <span className="text-[11px] text-stone-400">seconds</span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 group">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 fill-stone-950 ml-1" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-700/60 shadow-xs">
                          {completedCycles > 0 ? 'Resume Breathing' : 'Start Breathing'}
                        </span>
                        <span className="text-[10px] text-stone-400">Tap circle or button below</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instruction cue */}
              <div className="min-h-[48px] max-w-sm mt-2 flex flex-col items-center justify-center">
                <p className="text-sm sm:text-base font-semibold text-stone-100 transition-all duration-300">
                  {isActive ? currentPhase.instruction : 'Press Start to begin your mindful breathing reset'}
                </p>
                <p className="text-xs text-stone-400 mt-1 italic">
                  "{GROUNDING_TIPS[tipIndex]}"
                </p>
              </div>

              {/* Progress Tracker (Cycles) */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-stone-400">Cycle {completedCycles + 1} of {targetCycles}</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: targetCycles }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-1.5 rounded-full transition-all ${
                        i < completedCycles
                          ? 'bg-teal-400'
                          : i === completedCycles && isActive
                          ? 'bg-teal-500/60 animate-pulse'
                          : 'bg-stone-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {!isCompleted && (
          <div className="p-4 bg-stone-950/80 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <span>Goal:</span>
              {[
                { cycles: 3, label: '1 min' },
                { cycles: 5, label: '2 min' },
                { cycles: 8, label: '3 min' },
              ].map((g) => (
                <button
                  key={g.cycles}
                  onClick={() => setTargetCycles(g.cycles)}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                    targetCycles === g.cycles
                      ? 'bg-teal-900 text-teal-200 border border-teal-700'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReset(technique)}
                className="p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                title="Reset timer"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>{completedCycles > 0 ? 'Resume' : 'Start Breathing'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
