import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import TaskTimeline from '../models/TaskTimeline';

const router = Router();

interface Task {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  files?: string[];
  notes?: string;
  startDate?: string;
  endDate?: string;
  estimatedDays?: number;
  assignedTo?: string;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

// Paths
const TRACK_FILE = process.env.TASK_TRACK_FILE || path.join(__dirname, '../../docs/TASK_TRACKING.md');
// Use writable temp directory in production for runtime changes
const TMP_DIR = '/tmp';
const OVERRIDES_FILE = path.join(TMP_DIR, 'TASK_OVERRIDES.json');

function ensureOverridesStore() {
  try {
    if (!fs.existsSync(OVERRIDES_FILE)) {
      fs.writeFileSync(OVERRIDES_FILE, JSON.stringify([]), 'utf-8');
    }
  } catch {}
}

// Load timeline store from MongoDB
async function loadTimelineMap(): Promise<Record<string, { startDate?: string; endDate?: string; estimatedDays?: number }>> {
  try {
    const timelines = await TaskTimeline.find({}).lean();
    console.log(`📊 [TASKS] Loaded ${timelines.length} timelines from MongoDB`);
    const map: Record<string, { startDate?: string; endDate?: string; estimatedDays?: number }> = {};
    timelines.forEach(tl => {
      if (tl.taskTitle && (tl.startDate || tl.endDate)) {
        map[tl.taskTitle] = {
          startDate: tl.startDate || undefined,
          endDate: tl.endDate || undefined,
          estimatedDays: tl.estimatedDays || undefined
        };
        console.log(`✅ [TASKS] Loaded timeline for "${tl.taskTitle}": ${tl.startDate} to ${tl.endDate}`);
      }
    });
    return map;
  } catch (error) {
    console.error('❌ [TASKS] Error loading timelines from MongoDB:', error);
    return {};
  }
}

// Save timeline store to MongoDB
async function saveTimeline(title: string, data: { startDate?: string; endDate?: string; estimatedDays?: number }) {
  try {
    await TaskTimeline.findOneAndUpdate(
      { taskTitle: title },
      {
        taskTitle: title,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        estimatedDays: data.estimatedDays || null
      },
      { upsert: true, new: true }
    );
    console.log(`✅ [TASKS] Saved timeline for "${title}" to MongoDB`);
  } catch (error) {
    console.error(`❌ [TASKS] Error saving timeline for "${title}":`, error);
    throw error;
  }
}

type OverrideTask = { title: string; description?: string; section?: string; status?: 'not-started'|'in-progress'|'done'; files?: string[] };
function loadOverrides(): OverrideTask[] {
  ensureOverridesStore();
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf-8') || '[]');
  } catch {
    return [];
  }
}
function saveOverride(task: OverrideTask) {
  const list = loadOverrides();
  list.push(task);
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// Load tasks from markdown file
async function loadTasks(): Promise<Task[]> {
  try {
    const tasks: Task[] = [];
    let lines: string[] = [];

    // Read markdown tracker only if it exists in the container
    if (fs.existsSync(TRACK_FILE)) {
      const content = fs.readFileSync(TRACK_FILE, 'utf-8');
      lines = content.split('\n');
    } else {
      console.warn(`⚠️ [TASKS] Tracker file not found at ${TRACK_FILE}. Using built‑in defaults + runtime overrides.`);
      // Built-in seed tasks so the dashboard is not empty in environments where docs aren't deployed
      const seed: Task[] = [
        { id: `seed-1`, title: 'Performance Page - Dummy Data', status: 'not-started', priority: 'high', category: '🐛 Bug Fixes Needed', description: 'Replace all dummy data with real API data on performance page', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: `seed-2`, title: 'Portfolio Analysis Page - Delays & Dummy Data', status: 'in-progress', priority: 'high', category: '🐛 Bug Fixes Needed', description: 'Fix delay on sector segmentation, replace dummy analytics with real data', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: `seed-3`, title: 'Risk Management - All Dummy Data', status: 'not-started', priority: 'high', category: '🐛 Bug Fixes Needed', description: 'Implement real risk management data', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: `seed-4`, title: 'Reports Page - Dummy Data', status: 'not-started', priority: 'high', category: '🐛 Bug Fixes Needed', description: 'Show real earning dates and balance sheet analysis', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: `seed-5`, title: 'Stock Data Accuracy Issues', status: 'in-progress', priority: 'high', category: '🐛 Bug Fixes Needed', description: 'Fix percentage discrepancies with Google Finance (monthly ETF calculations)', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: `seed-6`, title: 'Volatility Calculations – Algorithm & Inputs', status: 'not-started', priority: 'high', category: '🐛 Bug Fixes Needed', description: 'Fix log-returns, sampling window, annualization; ensure inputs are correct', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
      tasks.push(...seed);
    }
    
    let currentSection = '';
    let taskId = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track sections
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
      }
      
      // Parse task items
      if (line.match(/^###\s+\d+\./)) {
        const titleMatch = line.match(/^###\s+\d+\.\s+(.+?)$/);
        if (titleMatch) {
          const title = titleMatch[1];
          
          // Look for status
          const statusLine = lines[Math.min(i + 1, lines.length - 1)];
          let status: 'not-started' | 'in-progress' | 'done' = 'not-started';
          let priority: 'high' | 'medium' | 'low' = 'low';
          let description = '';
          const files: string[] = [];
          
          if (statusLine && statusLine.includes('**Status:**')) {
            const statusMatch = statusLine.match(/\*\*Status:\*\*\s+([⬜🔄✅])/);
            if (statusMatch) {
              const statusEmoji = statusMatch[1];
              if (statusEmoji === '✅') status = 'done';
              else if (statusEmoji === '🔄') status = 'in-progress';
              else status = 'not-started';
            }
          }
          
          // Extract description - include Issue line content
          let j = i + 1;
          let desc = '';
          while (j < lines.length && !lines[j].startsWith('###')) {
            const line = lines[j].trim();
            if (!line) {
              j++;
              continue;
            }
            
            // Extract Issue text (the part after "**Issue:**")
            if (line.startsWith('**Issue:**')) {
              const issueText = line.replace(/^\*\*Issue:\*\*\s*/, '').trim();
              if (issueText) {
                desc += issueText + ' ';
              }
            }
            // Extract other description lines (but not Status or Files)
            else if (!line.startsWith('**Status:**') && !line.startsWith('**Files:**') && !line.startsWith('**Beta') && !line.startsWith('**Progress') && !line.startsWith('**Current') && !line.startsWith('**Specific') && !line.startsWith('**Details')) {
              desc += line + ' ';
            }
            
            // Extract files
            if (line.includes('**Files:**')) {
              const fileMatch = line.match(/`([^`]+)`/g);
              if (fileMatch) {
                fileMatch.forEach(f => files.push(f.replace(/`/g, '')));
              }
            }
            j++;
          }
          
          description = desc.trim();
          
          if (currentSection.toLowerCase().includes('critical') || currentSection.toLowerCase().includes('bug')) {
            priority = 'high';
          } else if (currentSection.toLowerCase().includes('new feature')) {
            priority = 'medium';
          }
          
          tasks.push({
            id: `task-${taskId++}`,
            title,
            status,
            priority,
            category: currentSection,
            description,
            files,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    console.log(`✅ [TASKS] Loaded ${tasks.length} tasks from tracker/defaults`);
    const volatilityTask = tasks.find(t => t.title.toLowerCase().includes('volatility'));
    if (volatilityTask) {
      console.log(`✅ [TASKS] Found Volatility task:`, volatilityTask.title, 'Status:', volatilityTask.status, 'Priority:', volatilityTask.priority);
    } else {
      console.log(`⚠️ [TASKS] Volatility task NOT found in parsed tasks`);
    }
    
    // Merge override tasks (runtime-added) from /tmp
    const overrides = loadOverrides();
    overrides.forEach((ov, idx) => {
      const section = ov.section || '🐛 Bug Fixes Needed';
      const priority = section.toLowerCase().includes('bug') || section.toLowerCase().includes('critical') ? 'high' : 'medium';
      tasks.push({
        id: `task-ov-${idx+1}`,
        title: ov.title,
        status: ov.status || 'not-started',
        priority: priority as any,
        category: section,
        description: ov.description || '',
        files: ov.files || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Merge timeline overrides from MongoDB
    const timelineMap = await loadTimelineMap();
    console.log(`🔗 [TASKS] Merging ${Object.keys(timelineMap).length} timelines into ${tasks.length} tasks`);
    tasks.forEach(t => {
      const tl = timelineMap[t.title];
      if (tl) {
        const hadDates = !!(t.startDate || t.endDate);
        t.startDate = tl.startDate || t.startDate;
        t.endDate = tl.endDate || t.endDate;
        t.estimatedDays = tl.estimatedDays ?? t.estimatedDays;
        if (tl.startDate || tl.endDate) {
          console.log(`✅ [TASKS] Applied timeline to "${t.title}": ${t.startDate} to ${t.endDate}${hadDates ? ' (had existing dates)' : ''}`);
        }
      }
    });

    return tasks;
  } catch (error) {
    console.error('❌ [TASKS] Error loading tasks:', error);
    // As a safety net, still return overrides if tracker failed to parse
    const overrides = loadOverrides();
    return overrides.map((ov, idx) => ({
      id: `task-ov-${idx+1}`,
      title: ov.title,
      status: ov.status || 'not-started',
      priority: (ov.section || '').toLowerCase().includes('bug') || (ov.section || '').toLowerCase().includes('critical') ? 'high' : 'medium',
      category: ov.section || '🐛 Bug Fixes Needed',
      description: ov.description || '',
      files: ov.files || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }
}

// GET all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await loadTasks();
    console.log(`📊 [TASKS API] Returning ${tasks.length} tasks`);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ tasks, total: tasks.length });
  } catch (error) {
    console.error('❌ [TASKS API] Error loading tasks:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error loading tasks' });
  }
});

// GET tasks by status
router.get('/status/:status', async (req: Request, res: Response) => {
  try {
    const tasks = await loadTasks();
    const status = req.params.status;
    const filtered = tasks.filter(t => t.status === status);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ tasks: filtered, total: filtered.length });
  } catch (error) {
    console.error('Error loading tasks:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error loading tasks' });
  }
});

// GET tasks by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const tasks = await loadTasks();
    const category = req.params.category;
    const filtered = tasks.filter(t => 
      t.category.toLowerCase().includes(category.toLowerCase())
    );
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ tasks: filtered, total: filtered.length });
  } catch (error) {
    console.error('Error loading tasks:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error loading tasks' });
  }
});

// GET task statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tasks = await loadTasks();
    const stats = {
      total: tasks.length,
      done: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      notStarted: tasks.filter(t => t.status === 'not-started').length,
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      byCategory: {} as Record<string, number>
    };
    
    tasks.forEach(task => {
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
    });
    
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json(stats);
  } catch (error) {
    console.error('Error loading stats:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error loading stats' });
  }
});

// POST update task timeline
router.post('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, estimatedDays } = req.body;

    console.log(`💾 [TASKS API] Saving timeline for task ID ${id}:`, { startDate, endDate, estimatedDays });

    const tasks = await loadTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) {
      console.error(`❌ [TASKS API] Task ${id} not found`);
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    console.log(`✅ [TASKS API] Found task: "${task.title}" (ID: ${id})`);

    // Persist timeline by title to MongoDB
    await saveTimeline(task.title, { startDate, endDate, estimatedDays });
    
    // Verify it was saved by loading it back
    const saved = await TaskTimeline.findOne({ taskTitle: task.title }).lean();
    console.log(`✅ [TASKS API] Timeline saved and verified:`, saved);
    
    // Update task object for response
    task.startDate = startDate;
    task.endDate = endDate;
    task.estimatedDays = estimatedDays;
    task.updatedAt = new Date().toISOString();

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ [TASKS API] Error updating task timeline:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error updating task timeline', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST update task status
router.post('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const tasks = await loadTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
    }
    
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error updating task status' });
  }
});

// GET Gantt chart data
router.get('/gantt', async (req: Request, res: Response) => {
  try {
    const tasks = await loadTasks();
    const ganttData = tasks.map(task => ({
      id: task.id,
      task: task.title,
      start: task.startDate || task.createdAt,
      end: task.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      progress: task.status === 'done' ? 100 : task.status === 'in-progress' ? 50 : 0,
      dependencies: task.dependencies || [],
      type: task.priority,
      status: task.status
    }));
    
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ data: ganttData });
  } catch (error) {
    console.error('Error loading Gantt data:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error loading Gantt data' });
  }
});

export default router;

// Create new task (runtime) and persist in /tmp store
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description = '', section = '🐛 Bug Fixes Needed', status = 'not-started', files = [] } = req.body || {};
    if (!title || typeof title !== 'string') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(400).json({ message: 'Title is required' });
    }

    // Save override runtime task (does not modify repo file on Render)
    saveOverride({ title, description, section, status, files });
    const tasks = await loadTasks();
    const newTask = tasks.find(t => t.title === title);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ success: true, task: newTask });
  } catch (error: any) {
    console.error('❌ [TASKS API] Error creating task:', error);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'Error creating task', error: error?.message || 'Unknown error' });
  }
});

