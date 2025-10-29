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

// Load tasks from markdown file
function loadTasks(): Task[] {
  try {
    const filePath = path.join(__dirname, '../../docs/TASK_TRACKING.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    
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
    
    // Update the markdown file (in production, use a proper database)
    const filePath = path.join(__dirname, '../../docs/TASK_TRACKING.md');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Find and update the task
    // For now, we'll just return success and store in memory
    // In production, implement proper persistence
    
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
      task.startDate = startDate;
      task.endDate = endDate;
      task.estimatedDays = estimatedDays;
      task.updatedAt = new Date().toISOString();
    }
    
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

