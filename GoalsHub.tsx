import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserGoal } from '../../types';
import { api } from '../../services/apiClient';

export const GoalsHub: React.FC = () => {
  const { refreshStats } = useAuth();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Goal Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<UserGoal['category']>('Personal Growth');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [milestonesInput, setMilestonesInput] = useState([
    'Research and identify first practice exercise',
    'Practice for 15 minutes 3 times this week',
    'Review progress and adjust next step',
  ]);
  const [saving, setSaving] = useState(false);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (e) {
      console.warn('Failed to load goals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleToggleMilestone = async (goal: UserGoal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);

    try {
      const updated = await api.updateGoal(goal.id, {
        milestones: updatedMilestones,
        progress,
        status: progress === 100 ? 'completed' : 'active',
      });
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Delete this goal and its milestones?')) {
      await api.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      refreshStats();
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || saving) return;
    setSaving(true);

    try {
      const created = await api.createGoal({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        deadline: newDeadline,
        milestones: milestonesInput.filter((m) => m.trim().length > 0),
      });
      setGoals((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      refreshStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const categories: UserGoal['category'][] = [
    'Confidence',
    'English',
    'Communication',
    'Career',
    'Study',
    'Personal Growth',
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-stone-900">Growth Goals</h1>
            <p className="text-xs text-stone-500">"Turn intentions into progress."</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-stone-400 text-xs">Loading your goals...</div>
        ) : goals.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center shadow-xs">
            <Target className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="font-heading font-bold text-stone-800 text-sm">No goals set yet</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Setting small, milestone-based goals helps you build momentum without getting overwhelmed.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {goal.category}
                    </span>
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      Target: {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                    {goal.progress === 100 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ✓ Achieved
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading text-base font-bold text-stone-900">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-stone-600 mt-1">{goal.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-stone-500">Progress</span>
                  <span className="text-emerald-700">{goal.progress}%</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Actionable Milestones
                </span>
                {goal.milestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMilestone(goal, m.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      m.completed ? 'bg-emerald-50/50 text-stone-400 line-through' : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <button type="button" className="shrink-0 focus:outline-hidden">
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-300" />
                      )}
                    </button>
                    <span>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading text-xl font-bold text-stone-900 mb-1">Set a New Growth Goal</h2>
            <p className="text-xs text-stone-500 mb-4">Break your ambitions into clear, doable steps.</p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Give a 3-minute presentation without panic"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Why does this matter to you?</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. To feel confident during my semester defense and future interviews"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Milestones (Step-by-step actions)
                </label>
                <div className="space-y-2">
                  {milestonesInput.map((m, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={m}
                      onChange={(e) => {
                        const updated = [...milestonesInput];
                        updated[idx] = e.target.value;
                        setMilestonesInput(updated);
                      }}
                      placeholder={`Step ${idx + 1}`}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMilestonesInput((prev) => [...prev, ''])}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  + Add another milestone
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newTitle.trim()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
