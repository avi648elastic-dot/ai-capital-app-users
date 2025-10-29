import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

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
const TRACK_FILE = path.join(__dirname, '../../docs/TASK_TRACKING.md');
// Use writable temp directory in production for runtime changes
const TMP_DIR = '/tmp';
const TIMELINE_FILE = path.join(TMP_DIR, 'TASK_TIMELINES.json');
const OVERRIDES_FILE = path.join(TMP_DIR, 'TASK_OVERRIDES.json');

// Ensure timeline store exists
function ensureTimelineStore() {
  try {
    if (!fs.existsSync(TIMELINE_FILE)) {
      fs.writeFileSync(TIMELINE_FILE, JSON.stringify({}), 'utf-8');
    }
  } catch {}
}

function ensureOverridesStore() {
  try {
    if (!fs.existsSync(OVERRIDES_FILE)) {
      fs.writeFileSync(OVERRIDES_FILE, JSON.stringify([]), 'utf-8');
    }
  } catch {}
}

// Load timeline store
function loadTimelineMap(): Record<string, { startDate?: string; endDate?: string; estimatedDays?: number }> {
  ensureTimelineStore();
  try {
    const raw = fs.readFileSync(TIMELINE_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

// Save timeline store
function saveTimeline(title: string, data: { startDate?: string; endDate?: string; estimatedDays?: number }) {
  const map = loadTimelineMap();
  map[title] = { ...map[title], ...data };
  fs.writeFileSync(TIMELINE_FILE, JSON.stringify(map, null, 2), 'utf-8');
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
function loadTasks(): Task[] {
  try {
    const tasks: Task[] = [];
    let lines: string[] = [];

    // Read markdown tracker only if it exists in the container
    if (fs.existsSync(TRACK_FILE)) {
      const content = fs.readFileSync(TRACK_FILE, 'utf-8');
      lines = content.split('\n');
    } else {
      console.warn(`⚠️ [TASKS] Tracker file not found at ${TRACK_FILE}. Using runtime overrides only.`);
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
    
    console.log(`✅ [TASKS] Loaded ${tasks.length} tasks from tracker file`);
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

    // Merge timeline overrides
    const timelineMap = loadTimelineMap();
    tasks.forEach(t => {
      const tl = timelineMap[t.title];
      if (tl) {
        t.startDate = tl.startDate || t.startDate;
        t.endDate = tl.endDate || t.endDate;
        t.estimatedDays = tl.estimatedDays ?? t.estimatedDays;
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
router.get('/', (req: Request, res: Response) => {
  try {
    const tasks = loadTasks();
    console.log(`📊 [TASKS API] Returning ${tasks.length} tasks`);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.json({ tasks, total: tasks.length });
  } catch (error) {
    console.error('❌ [TASKS API] Error loading tasks:', error);
    res.status(500).json({ message: 'Error loading tasks' });
  }
});

// GET tasks by status
router.get('/status/:status', (req: Request, res: Response) => {
  try {
    const tasks = loadTasks();
    const status = req.params.status;
    const filtered = tasks.filter(t => t.status === status);
    res.json({ tasks: filtered, total: filtered.length });
  } catch (error) {
    console.error('Error loading tasks:', error);
    res.status(500).json({ message: 'Error loading tasks' });
  }
});

// GET tasks by category
router.get('/category/:category', (req: Request, res: Response) => {
  try {
    const tasks = loadTasks();
    const category = req.params.category;
    const filtered = tasks.filter(t => 
      t.category.toLowerCase().includes(category.toLowerCase())
    );
    res.json({ tasks: filtered, total: filtered.length });
  } catch (error) {
    console.error('Error loading tasks:', error);
    res.status(500).json({ message: 'Error loading tasks' });
  }
});

// GET task statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const tasks = loadTasks();
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
    
    res.json(stats);
  } catch (error) {
    console.error('Error loading stats:', error);
    res.status(500).json({ message: 'Error loading stats' });
  }
});

// POST update task timeline
router.post('/:id/timeline', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, estimatedDays } = req.body;

    const tasks = loadTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Persist timeline by title
    saveTimeline(task.title, { startDate, endDate, estimatedDays });
    task.startDate = startDate;
    task.endDate = endDate;
    task.estimatedDays = estimatedDays;
    task.updatedAt = new Date().toISOString();

    res.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task timeline:', error);
    res.status(500).json({ message: 'Error updating task timeline' });
  }
});

// POST update task status
router.post('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
    }
    
    res.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Error updating task status' });
  }
});

// GET Gantt chart data
router.get('/gantt', (req: Request, res: Response) => {
  try {
    const tasks = loadTasks();
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
    
    res.json({ data: ganttData });
  } catch (error) {
    console.error('Error loading Gantt data:', error);
    res.status(500).json({ message: 'Error loading Gantt data' });
  }
});

export default router;

// Create new task (runtime) and persist in /tmp store
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description = '', section = '🐛 Bug Fixes Needed', status = 'not-started', files = [] } = req.body || {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Save override runtime task (does not modify repo file on Render)
    saveOverride({ title, description, section, status, files });
    const tasks = loadTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('❌ [TASKS API] Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

