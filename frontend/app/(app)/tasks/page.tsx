'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import Header from '@/components/Header';

interface Task {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  files?: string[];
  startDate?: string;
  endDate?: string;
  estimatedDays?: number;
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'gantt' | 'dashboard'>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineData, setTimelineData] = useState({ startDate: '', endDate: '', estimatedDays: 0 });

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, selectedStatus]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data.tasks);
      setFilteredTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/tasks/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    setFilteredTasks(filtered);
  };

  const handleSetTimeline = async () => {
    if (!selectedTask) return;
    
    try {
      await axios.post(`/api/tasks/${selectedTask.id}/timeline`, timelineData);
      setShowTimelineModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Error setting timeline:', error);
    }
  };

  const openTimelineModal = (task: Task) => {
    setSelectedTask(task);
    setTimelineData({
      startDate: task.startDate || '',
      endDate: task.endDate || '',
      estimatedDays: task.estimatedDays || 0
    });
    setShowTimelineModal(true);
  };

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
      <Layout>
        <Header title="📋 Task Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-slate-400">Loading tasks...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="📋 Project Task Dashboard" />
      
      <div className="p-4 sm:p-6 space-y-6">
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            📝 List View
          </button>
          <button
            onClick={() => setView('gantt')}
            className={`px-4 py-2 rounded-lg ${view === 'gantt' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            📅 Gantt Chart
          </button>
        </div>

        {/* Statistics Dashboard */}
        {view === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            {/* High Priority Tasks */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🔥 High Priority Tasks</h2>
              <div className="space-y-2">
                {tasks.filter(t => t.priority === 'high').slice(0, 5).map((task) => (
                  <div key={task.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span>{task.status === 'done' ? '✅' : task.status === 'in-progress' ? '🔄' : '⬜'}</span>
                        <span className="font-semibold text-white">{task.title}</span>
                        <span className="px-2 py-1 bg-red-500 rounded text-xs text-white">HIGH</span>
                      </div>
                      {task.endDate && (
                        <button
                          onClick={() => openTimelineModal(task)}
                          className="px-3 py-1 bg-blue-600 rounded text-sm text-white hover:bg-blue-700"
                        >
                          📅 {formatDate(task.endDate)}
                        </button>
                      )}
                      {!task.endDate && (
                        <button
                          onClick={() => openTimelineModal(task)}
                          className="px-3 py-1 bg-slate-600 rounded text-sm text-white hover:bg-slate-700"
                        >
                          Set Timeline
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
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

            {/* Tasks */}
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {task.status === 'done' ? '✅' : task.status === 'in-progress' ? '🔄' : '⬜'}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>📁 {task.category}</span>
                      {task.startDate && <span>📅 Start: {formatDate(task.startDate)}</span>}
                      {task.endDate && <span>🏁 End: {formatDate(task.endDate)}</span>}
                      {task.startDate && task.endDate && (
                        <span>⏱️ {getDaysBetween(task.startDate, task.endDate)} days</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openTimelineModal(task)}
                    className="ml-4 px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 text-sm"
                  >
                    {task.endDate ? '✏️ Edit Timeline' : '📅 Set Timeline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gantt Chart View */}
        {view === 'gantt' && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-white text-lg font-bold mb-4">Project Gantt Chart</div>
              <div className="space-y-3">
                {tasks
                  .filter(t => t.endDate)
                  .map((task) => {
                    const startDate = task.startDate ? new Date(task.startDate) : new Date();
                    const endDate = task.endDate ? new Date(task.endDate) : new Date();
                    const now = new Date();
                    const totalDays = getDaysBetween(task.startDate || '', task.endDate || '');
                    const daysElapsed = Math.max(0, getDaysBetween(task.startDate || '', now.toISOString()));
                    const progress = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
                    
                    return (
                      <div key={task.id} className="relative">
                        <div className="flex items-center gap-4 mb-1">
                          <span className="text-sm text-white font-semibold w-48 truncate">{task.title}</span>
                          <span className="text-xs text-slate-400">{formatDate(task.startDate || '')} - {formatDate(task.endDate || '')}</span>
                        </div>
                        <div className="relative h-8 bg-slate-700 rounded overflow-hidden">
                          <div 
                            className={`h-full ${
                              task.status === 'done' ? 'bg-green-500' :
                              task.status === 'in-progress' ? 'bg-blue-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${task.status === 'done' ? 100 : progress}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                            {task.status === 'done' ? '✅' : Math.round(progress)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {tasks.filter(t => t.endDate).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No tasks with timelines set. Set timelines to see Gantt chart.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Modal */}
      {showTimelineModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Set Timeline for Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={timelineData.startDate}
                  onChange={(e) => setTimelineData({ ...timelineData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={timelineData.endDate}
                  onChange={(e) => setTimelineData({ ...timelineData, endDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Estimated Days</label>
                <input
                  type="number"
                  value={timelineData.estimatedDays}
                  onChange={(e) => setTimelineData({ ...timelineData, estimatedDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSetTimeline}
                  className="flex-1 px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
                >
                  Save Timeline
                </button>
                <button
                  onClick={() => setShowTimelineModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 rounded text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
