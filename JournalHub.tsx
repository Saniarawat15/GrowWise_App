import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Smile,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { JournalEntry, MoodType } from '../../types';
import { api } from '../../services/apiClient';

interface JournalHubProps {
  initialOpenEditor?: boolean;
}

export const JournalHub: React.FC<JournalHubProps> = ({ initialOpenEditor = false }) => {
  const { refreshStats } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(initialOpenEditor);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorMood, setEditorMood] = useState<MoodType>('good');
  const [saving, setSaving] = useState(false);

  // AI Reflection Modal State
  const [activeReflectionEntry, setActiveReflectionEntry] = useState<JournalEntry | null>(null);
  const [generatingReflection, setGeneratingReflection] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getJournal({
        search: searchQuery || undefined,
        mood: selectedMood || undefined,
      });
      setEntries(data);
    } catch (e) {
      console.warn('Failed to load journal entries', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [searchQuery, selectedMood]);

  const handleOpenNew = () => {
    setEditingEntryId(null);
    setEditorTitle('');
    setEditorContent('');
    setEditorMood('good');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditorTitle(entry.title);
    setEditorContent(entry.content);
    setEditorMood(entry.mood);
    setIsEditorOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle.trim() || !editorContent.trim() || saving) return;
    setSaving(true);

    try {
      if (editingEntryId) {
        const updated = await api.updateJournalEntry(editingEntryId, {
          title: editorTitle.trim(),
          content: editorContent.trim(),
          mood: editorMood,
        });
        setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createJournalEntry({
          title: editorTitle.trim(),
          content: editorContent.trim(),
          mood: editorMood,
        });
        setEntries((prev) => [created, ...prev]);
      }
      setIsEditorOpen(false);
      refreshStats();
    } catch (err) {
      console.error('Error saving entry:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Delete this journal entry? This cannot be undone.')) {
      await api.deleteJournalEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      refreshStats();
    }
  };

  const handleReflectWithAI = async (entry: JournalEntry) => {
    setActiveReflectionEntry(entry);
    if (!entry.ai_reflection) {
      setGeneratingReflection(true);
      try {
        const updated = await api.reflectOnJournal(entry.id);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setActiveReflectionEntry(updated);
      } catch (err) {
        console.error('Failed to generate reflection', err);
      } finally {
        setGeneratingReflection(false);
      }
    }
  };

  const moodEmojis: Record<MoodType, { emoji: string; label: string; bg: string }> = {
    great: { emoji: '😊', label: 'Great', bg: 'bg-emerald-100 text-emerald-800' },
    good: { emoji: '🙂', label: 'Good', bg: 'bg-teal-100 text-teal-800' },
    okay: { emoji: '😐', label: 'Okay', bg: 'bg-stone-100 text-stone-800' },
    low: { emoji: '😔', label: 'Low', bg: 'bg-amber-100 text-amber-800' },
    difficult: { emoji: '😣', label: 'Tough', bg: 'bg-rose-100 text-rose-800' },
  };

  const promptIdeas = [
    'What made today meaningful or challenging?',
    'What is one situation that made you hesitate, and why?',
    'What is one mistake you made, and what can you learn from it?',
    'What is something you handled better today than you would have six months ago?',
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-stone-900">Private Journal</h1>
            <p className="text-xs text-stone-500">"Write it down. Understand yourself."</p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Search & Mood Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your journal reflections..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedMood('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedMood === '' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            All
          </button>
          {(['great', 'good', 'okay', 'low', 'difficult'] as MoodType[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMood(selectedMood === m ? '' : m)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedMood === m
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{moodEmojis[m].emoji}</span>
              <span className="capitalize">{moodEmojis[m].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-stone-400 text-xs">Loading journal entries...</div>
        ) : entries.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center shadow-xs">
            <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="font-heading font-bold text-stone-800 text-sm">No reflections found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Writing down your thoughts helps clear mental fog and track your personal progress over time.
            </p>
            <button
              onClick={handleOpenNew}
              className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
            >
              Write First Entry
            </button>
          </div>
        ) : (
          entries.map((entry) => {
            const moodInfo = moodEmojis[entry.mood] || moodEmojis.good;
            return (
              <div
                key={entry.id}
                className="bg-white p-5 rounded-3xl border border-stone-200 hover:border-emerald-200 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${moodInfo.bg}`}>
                        {moodInfo.emoji} {moodInfo.label}
                      </span>
                      <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-heading text-base font-bold text-stone-900">{entry.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 text-stone-400">
                    <button
                      onClick={() => handleOpenEdit(entry)}
                      className="p-1.5 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {entry.content}
                </p>

                {/* AI Reflection Summary Card / Trigger */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => handleReflectWithAI(entry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{entry.ai_reflection ? 'View AI Reflection' : 'Reflect with AI'}</span>
                  </button>

                  <span className="text-[11px] text-stone-400">
                    {entry.ai_reflection ? '✓ Reflected' : 'Private'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading text-xl font-bold text-stone-900 mb-1">
              {editingEntryId ? 'Edit Journal Reflection' : 'New Journal Reflection'}
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Write freely. This space is private to your account.
            </p>

            <form onSubmit={handleSaveEntry} className="flex-1 flex flex-col space-y-4 overflow-y-auto">
              {/* Mood picker */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">How are you feeling?</label>
                <div className="flex items-center gap-2">
                  {(['great', 'good', 'okay', 'low', 'difficult'] as MoodType[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditorMood(m)}
                      className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                        editorMood === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span className="text-lg">{moodEmojis[m].emoji}</span>
                      <span className="text-[10px] capitalize">{moodEmojis[m].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title / Headline</label>
                <input
                  type="text"
                  required
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="e.g. Reflections on today's team project meeting..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              {/* Prompt Ideas Chips */}
              <div>
                <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Need a prompt? Tap to insert:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {promptIdeas.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditorContent((prev) => (prev ? `${prev}\n\n${p}\n` : `${p}\n`))}
                      className="text-[11px] px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-left"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-[140px]">
                <label className="block text-xs font-semibold text-stone-700 mb-1">Your Thoughts</label>
                <textarea
                  rows={6}
                  required
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Express your thoughts honestly without filtering yourself..."
                  className="w-full h-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !editorTitle.trim() || !editorContent.trim()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Reflection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Reflection Viewer Modal */}
      {activeReflectionEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveReflectionEntry(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-emerald-800">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-stone-900">AI Growth Reflection</h3>
            </div>

            <p className="text-xs text-stone-500 mb-4">
              On: "{activeReflectionEntry.title}"
            </p>

            {generatingReflection ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-stone-600 font-medium">
                  GrowWise is analyzing themes and positive patterns...
                </p>
              </div>
            ) : activeReflectionEntry.ai_reflection ? (
              <div className="space-y-4 text-xs sm:text-sm">
                {/* Themes */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[11px] font-bold text-stone-500 uppercase block mb-1.5">
                    Themes & Topics Identified
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReflectionEntry.ai_reflection.themes.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-stone-800 text-xs font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Positive Observation */}
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-950 uppercase block mb-1">
                    Positive Observations
                  </span>
                  <ul className="space-y-1 text-emerald-900 text-xs list-disc pl-4">
                    {activeReflectionEntry.ai_reflection.positiveObservations.map((obs, idx) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                </div>

                {/* Patterns */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[11px] font-bold text-stone-500 uppercase block mb-1">
                    Behavioral Pattern Note
                  </span>
                  <p className="text-stone-700 text-xs leading-relaxed">
                    {activeReflectionEntry.ai_reflection.patterns}
                  </p>
                </div>

                {/* Questions for Reflection */}
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-950 uppercase block mb-1.5">
                    Questions for Your Self-Reflection
                  </span>
                  <div className="space-y-1.5 text-xs text-amber-900">
                    {activeReflectionEntry.ai_reflection.questionsForReflection.map((q, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <span className="font-medium">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveReflectionEntry(null)}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl"
                  >
                    Done Reflecting
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
