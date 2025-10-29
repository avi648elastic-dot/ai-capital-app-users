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
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editDates, setEditDates] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    // Load mock data immediately, then try to fetch from API
    const mockData = getMockTasks();
    setTasks(mockData);
    setLoading(false);
    
    // Try to fetch real data in background
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      console.log('🔍 [TASKS] Fetching from:', `${apiUrl}/api/tasks`);
      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      console.log('📡 [TASKS] Response status:', response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TASKS] Received', data.tasks?.length || 0, 'tasks');
        if (data.tasks && data.tasks.length > 0) {
          setTasks(data.tasks);
          const volatilityTask = data.tasks.find((t: Task) => t.title.toLowerCase().includes('volatility'));
          if (volatilityTask) {
            console.log('✅ [TASKS] Volatility task found in response:', volatilityTask.title);
          } else {
            console.log('⚠️ [TASKS] Volatility task NOT in API response');
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [TASKS] API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ [TASKS] Fetch error:', error);
      // Keep mock data
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
      const localStats = {
        total: tasks.length,
        done: tasks.filter(t => t.status === 'done').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        notStarted: tasks.filter(t => t.status === 'not-started').length
      };
      setStats(localStats);
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
        estimatedDays: 7
      },
      {
        id: 'task-2',
        title: 'Portfolio Analysis - Sector Segmentation Delay',
        status: 'in-progress',
        priority: 'high',
        category: 'Bug Fixes',
        description: 'Fix delay on sector segmentation loading',
        estimatedDays: 3
      },
      {
        id: 'task-3',
        title: 'Risk Management - All Dummy Data',
        status: 'not-started',
        priority: 'medium',
        category: 'Bug Fixes',
        description: 'Implement real risk management data',
        estimatedDays: 10
      },
      {
        id: 'task-4',
        title: 'Reports Page - Earning Dates & Balance Sheet',
        status: 'not-started',
        priority: 'medium',
        category: 'Bug Fixes',
        description: 'Show real earning dates and balance sheet analysis',
        estimatedDays: 5
      },
      {
        id: 'task-5',
        title: 'Mobile UI/UX Improvements',
        status: 'in-progress',
        priority: 'high',
        category: 'UI/UX',
        description: 'Fix mobile notification, leaderboard, and expert button displays',
        estimatedDays: 4
      },
      {
        id: 'task-6',
        title: 'Onboarding Engine - AI Enhancement',
        status: 'not-started',
        priority: 'high',
        category: 'Critical Issues',
        description: 'AI enhancement for bank stock recommendations not working properly',
        estimatedDays: 8
      }
    ];
  };

  const handleSetDates = (task: Task) => {
    setEditDates({
      startDate: task.startDate || '',
      endDate: task.endDate || ''
    });
    setEditingTask(task.id);
  };

  const saveDates = () => {
    if (!editingTask) return;
    
    setTasks(tasks.map(task => 
      task.id === editingTask 
        ? { ...task, startDate: editDates.startDate, endDate: editDates.endDate }
        : task
    ));
    
    setEditingTask(null);
    setEditDates({ startDate: '', endDate: '' });
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

  const tasksWithTimelines = tasks.filter(t => t.startDate && t.endDate);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">📋 AI Capital Task Dashboard</h1>
        
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        <div className="space-y-4 mb-8">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No tasks found
            </div>
          ) : (
            filteredTasks.map((task) => {
              const statusIcon = task.status === 'done' ? '✅' : task.status === 'in-progress' ? '🔄' : '⬜';
              const priorityColor = task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500';
              
              return (
                <div key={task.id} className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                    <button
                      onClick={() => handleSetDates(task)}
                      className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 text-sm whitespace-nowrap"
                    >
                      {task.startDate && task.endDate ? '✏️ Edit Dates' : '📅 Set Timeline'}
                    </button>
                  </div>
                  
                  {/* Inline Date Editor */}
                  {editingTask === task.id && (
                    <div className="mt-4 p-4 bg-slate-700 rounded border border-slate-600">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={editDates.startDate}
                            onChange={(e) => setEditDates({ ...editDates, startDate: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">End Date</label>
                          <input
                            type="date"
                            value={editDates.endDate}
                            onChange={(e) => setEditDates({ ...editDates, endDate: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={saveDates}
                          className="flex-1 px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700"
                        >
                          ✅ Save Timeline
                        </button>
                        <button
                          onClick={() => setEditingTask(null)}
                          className="flex-1 px-4 py-2 bg-slate-600 rounded text-white hover:bg-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Gantt Chart - Shows automatically when tasks have dates */}
        {tasksWithTimelines.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700 mt-8">
            <div className="text-white text-xl font-bold mb-6">📅 Gantt Chart View</div>
            <div className="space-y-4 overflow-x-auto">
              {tasksWithTimelines
                .sort((a, b) => {
                  const dateA = new Date(a.startDate!).getTime();
                  const dateB = new Date(b.startDate!).getTime();
                  return dateA - dateB;
                })
                .map((task) => {
                  const startDate = new Date(task.startDate!);
                  const endDate = new Date(task.endDate!);
                  const now = new Date();
                  const totalDays = getDaysBetween(task.startDate!, task.endDate!);
                  const daysElapsed = Math.max(0, getDaysBetween(task.startDate!, now.toISOString()));
                  const daysRemaining = Math.max(0, getDaysBetween(now.toISOString(), task.endDate!));
                  const progress = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
                  
                  const statusColor = 
                    task.status === 'done' ? 'bg-green-500' :
                    task.status === 'in-progress' ? 'bg-blue-500' :
                    'bg-yellow-500';
                  
                  return (
                    <div key={task.id} className="mb-6">
                      <div className="flex items-center gap-4 mb-2 flex-wrap">
                        <span className="text-sm text-white font-semibold min-w-[200px] sm:min-w-[300px]">{task.title}</span>
                        <span className="text-xs text-slate-400">
                          {formatDate(task.startDate!)} → {formatDate(task.endDate!)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs text-white ${
                          task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="relative h-8 bg-slate-700 rounded overflow-hidden border border-slate-600">
                        <div 
                          className={`h-full ${statusColor} transition-all duration-500 flex items-center justify-center`}
                          style={{ width: `${task.status === 'done' ? 100 : progress}%` }}
                        >
                          <span className="text-xs text-white font-bold">
                            {task.status === 'done' ? '✅ DONE' : task.status === 'in-progress' ? '🔄 IN PROGRESS' : `${Math.round(progress)}%`}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 ml-2">
                        {totalDays} days total • {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Overdue'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-slate-800 rounded-lg border border-slate-700 text-center text-slate-400 text-sm">
          <p>📊 Click "Set Timeline" on any task to add dates and see it appear in the Gantt chart</p>
          <p className="mt-2">💡 Gantt chart updates automatically when you add dates</p>
        </div>
      </div>
    </div>
  );
}
