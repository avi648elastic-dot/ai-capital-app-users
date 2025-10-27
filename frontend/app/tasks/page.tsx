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
  const [view, setView] = useState<'list' | 'gantt'>('list');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('https://ai-capital-app7.onrender.com/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        console.log('Using mock data');
        setTasks(getMockTasks());
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks(getMockTasks());
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('https://ai-capital-app7.onrender.com/api/tasks/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use mock stats
      setStats({
        total: tasks.length,
        done: tasks.filter(t => t.status === 'done').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        notStarted: tasks.filter(t => t.status === 'not-started').length
      });
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      fetchStats();
    }
  }, [tasks]);

  const getMockTasks = (): Task[] => {
    const now = new Date();
    return [
      {
        id: 'task-1',
        title: 'Fix Performance Page - Dummy Data',
        status: 'not-started',
        priority: 'high',
        category: 'Bug Fixes',
        description: 'Replace all dummy data with real API data',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDays: 7
      },
      {
        id: 'task-2',
        title: 'Portfolio Analysis - Sector Segmentation Delay',
        status: 'in-progress',
        priority: 'high',
        category: 'Bug Fixes',
        description: 'Fix delay on sector segmentation loading',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDays: 3
      },
      {
        id: 'task-3',
        title: 'Risk Management - All Dummy Data',
        status: 'not-started',
        priority: 'medium',
        category: 'Bug Fixes',
        description: 'Implement real risk management data',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDays: 10
      },
      {
        id: 'task-4',
        title: 'Reports Page - Earning Dates & Balance Sheet',
        status: 'not-started',
        priority: 'medium',
        category: 'Bug Fixes',
        description: 'Show real earning dates and balance sheet analysis',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDays: 5
      },
      {
        id: 'task-5',
        title: 'Mobile UI/UX Improvements',
        status: 'in-progress',
        priority: 'high',
        category: 'UI/UX',
        description: 'Fix mobile notification, leaderboard, and expert button displays',
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDays: 4
      },
      {
        id: 'task-6',
        title: 'Onboarding Engine - AI Enhancement',
        status: 'not-started',
        priority: 'high',
        category: 'Critical Issues',
        description: 'AI enhancement for bank stock recommendations not working properly',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDays: 8
      }
    ];
  };

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
        <h1 className="text-4xl font-bold mb-4 text-center">📋 AI Capital Task Tracker</h1>
        
        {/* View Toggle */}
        <div className="flex gap-2 mb-6 justify-center">
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

        {/* Filters - Only show in list view */}
        {view === 'list' && (
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
        )}

        {/* List View */}
        {view === 'list' && (
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
        )}

        {/* Gantt Chart View */}
        {view === 'gantt' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-white text-xl font-bold mb-6">📅 Project Gantt Chart</div>
            <div className="space-y-4">
              {tasks
                .filter(t => t.endDate)
                .sort((a, b) => {
                  const dateA = new Date(a.startDate || '').getTime();
                  const dateB = new Date(b.startDate || '').getTime();
                  return dateA - dateB;
                })
                .map((task) => {
                  const startDate = task.startDate ? new Date(task.startDate) : new Date();
                  const endDate = task.endDate ? new Date(task.endDate) : new Date();
                  const now = new Date();
                  const totalDays = getDaysBetween(task.startDate || '', task.endDate || '');
                  const daysElapsed = Math.max(0, getDaysBetween(task.startDate || '', now.toISOString()));
                  const progress = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
                  
                  const statusColor = 
                    task.status === 'done' ? 'bg-green-500' :
                    task.status === 'in-progress' ? 'bg-blue-500' :
                    'bg-yellow-500';
                  
                  return (
                    <div key={task.id} className="relative mb-8">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm text-white font-semibold min-w-[300px]">{task.title}</span>
                        <span className="text-xs text-slate-400">
                          {formatDate(task.startDate || '')} → {formatDate(task.endDate || '')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs text-white ${
                          task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="relative h-10 bg-slate-700 rounded overflow-hidden border border-slate-600">
                        <div 
                          className={`h-full ${statusColor} transition-all duration-500`}
                          style={{ width: `${task.status === 'done' ? 100 : progress}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                          {task.status === 'done' ? '✅ DONE' : `${task.status === 'in-progress' ? '🔄 ' : ''}${Math.round(progress)}%`}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 ml-2">
                        {totalDays} days total • {getDaysBetween(task.endDate || '', now.toISOString())} days remaining
                      </div>
                    </div>
                  );
                })}
              {tasks.filter(t => t.endDate).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No tasks with timelines set
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-slate-800 rounded-lg border border-slate-700 text-center text-slate-400 text-sm">
          <p>📊 Public task tracker for AI Capital project development</p>
          <p className="mt-2">💡 Tasks update automatically from backend</p>
        </div>
      </div>
    </div>
  );
}
