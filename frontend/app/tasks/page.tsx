'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  startDate?: string;
  endDate?: string;
  estimatedDays?: number;
}

export default function PublicTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('https://ai-capital-app7.onrender.com/api/tasks');
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('https://ai-capital-app7.onrender.com/api/tasks/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredTasks = selectedStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === selectedStatus);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysBetween = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-slate-400">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">📋 AI Capital Project Task Tracker</h1>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400">Total Tasks</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
              <div className="text-sm text-green-300">✅ Done</div>
              <div className="text-2xl font-bold text-green-400">{stats.done}</div>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
              <div className="text-sm text-blue-300">🔄 In Progress</div>
              <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400">⬜ Not Started</div>
              <div className="text-2xl font-bold text-white">{stats.notStarted}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="not-started">⬜ Not Started</option>
            <option value="in-progress">🔄 In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No tasks found
            </div>
          ) : (
            filteredTasks.map((task) => {
              const statusIcon = task.status === 'done' ? '✅' : task.status === 'in-progress' ? '🔄' : '⬜';
              const priorityColor = task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500';
              
              return (
                <div key={task.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{statusIcon}</span>
                        <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${priorityColor}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>📁 {task.category}</span>
                        {task.startDate && <span>📅 Start: {formatDate(task.startDate)}</span>}
                        {task.endDate && <span>🏁 End: {formatDate(task.endDate)}</span>}
                        {task.startDate && task.endDate && (
                          <span>⏱️ {getDaysBetween(task.startDate, task.endDate)} days</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-slate-800 rounded-lg border border-slate-700 text-center text-slate-400 text-sm">
          <p>📊 This is a public task tracker for AI Capital project development</p>
          <p className="mt-2">💡 Only you can mark tasks as complete</p>
        </div>
      </div>
    </div>
  );
}

