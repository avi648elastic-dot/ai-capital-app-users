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
const TIMELINE_FILE = path.join(__dirname, '../../docs/TASK_TIMELINES.json');

// Ensure timeline store exists
function ensureTimelineStore() {
  try {
    if (!fs.existsSync(TIMELINE_FILE)) {
      fs.writeFileSync(TIMELINE_FILE, JSON.stringify({}), 'utf-8');
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

// Load tasks from markdown file
function loadTasks(): Task[] {
  try {
    const content = fs.readFileSync(TRACK_FILE, 'utf-8');
    
    // Parse markdown to extract tasks
    const tasks: Task[] = [];
    const lines = content.split('\n');
    
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
    
    console.log(`✅ [TASKS] Loaded ${tasks.length} tasks from TASK_TRACKING.md`);
    const volatilityTask = tasks.find(t => t.title.toLowerCase().includes('volatility'));
    if (volatilityTask) {
      console.log(`✅ [TASKS] Found Volatility task:`, volatilityTask.title, 'Status:', volatilityTask.status, 'Priority:', volatilityTask.priority);
    } else {
      console.log(`⚠️ [TASKS] Volatility task NOT found in parsed tasks`);
    }
    
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
    return [];
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

// Create new task and append to a section (default: Bug Fixes)
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description = '', section = '🐛 Bug Fixes Needed', status = 'not-started', files = [] } = req.body || {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Title is required' });
    }

    const md = fs.readFileSync(TRACK_FILE, 'utf-8');
    const lines = md.split('\n');

    // Find section start and end
    let start = -1; let end = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ') && lines[i].includes(section)) {
        start = i;
        for (let j = i + 1; j < lines.length; j++) {
          if (j > i && lines[j].startsWith('## ')) { end = j; break; }
        }
        break;
      }
    }
    if (start === -1) return res.status(400).json({ message: 'Section not found in TASK_TRACKING.md' });

    // Determine next task number within section
    let maxNum = 0;
    for (let i = start; i < end; i++) {
      const m = lines[i].match(/^###\s+(\d+)\./);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    }
    const nextNum = maxNum + 1;

    // Build task block
    const statusEmoji = status === 'done' ? '✅' : status === 'in-progress' ? '🔄' : '⬜';
    const filesLine = files.length ? `**Files:** ${files.map((f: string) => '`' + f + '`').join(', ')}` : '';
    const block = [
      `### ${nextNum}. ${title}`,
      `**Status:** ${statusEmoji} ${status === 'not-started' ? 'Not Started' : status === 'in-progress' ? 'In Progress' : 'Done'}  `,
      `**Issue:** ${description}`,
      filesLine,
      ''
    ].filter(Boolean).join('\n');

    // Insert before end of section
    const before = lines.slice(0, end).join('\n');
    const after = lines.slice(end).join('\n');
    const updated = `${before}\n${block}\n${after}`;
    fs.writeFileSync(TRACK_FILE, updated, 'utf-8');

    const tasks = loadTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('❌ [TASKS API] Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

