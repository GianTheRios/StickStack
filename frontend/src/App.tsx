import { useState } from 'react';
import { Board } from './components/Board';
import { PRDUpload, type ParsedPRD } from './components/PRDUpload';
import { PRDViewer } from './components/PRDViewer';
import type { ViewMode } from './types';

const API_URL = 'http://localhost:3001';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [parsedPRD, setParsedPRD] = useState<ParsedPRD | null>(null);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [showExistingTasksDialog, setShowExistingTasksDialog] = useState(false);
  const [existingTaskCount, setExistingTaskCount] = useState(0);

  const handlePRDParsed = (prd: ParsedPRD) => {
    setParsedPRD(prd);
    setViewMode('prd');
  };

  const createTasksFromPRD = async () => {
    if (!parsedPRD) return;

    for (const phase of parsedPRD.phases) {
      for (const task of phase.tasks) {
        const response = await fetch(`${API_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description || `Phase: ${phase.name}`,
            priority: 'medium',
          }),
        });

        if (!response.ok) {
          console.error('Failed to create task:', task.title);
          continue;
        }

        if (task.completed) {
          const createdTask = await response.json();
          await fetch(`${API_URL}/api/tasks/${createdTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' }),
          });
        }
      }
    }
  };

  const deleteAllTasks = async () => {
    const response = await fetch(`${API_URL}/api/tasks`);
    const tasks = await response.json();

    for (const task of tasks) {
      await fetch(`${API_URL}/api/tasks/${task.id}`, { method: 'DELETE' });
    }
  };

  const handleStartProject = async () => {
    if (!parsedPRD || isCreatingTasks) return;

    setIsCreatingTasks(true);

    try {
      // Check for existing tasks
      const response = await fetch(`${API_URL}/api/tasks`);
      const existingTasks = await response.json();

      if (existingTasks.length > 0) {
        // Show dialog to ask user what to do
        setExistingTaskCount(existingTasks.length);
        setShowExistingTasksDialog(true);
        setIsCreatingTasks(false);
        return;
      }

      // No existing tasks, create from PRD
      await createTasksFromPRD();
      setViewMode('kanban');
    } catch (error) {
      console.error('Failed to create tasks:', error);
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleStartFresh = async () => {
    setShowExistingTasksDialog(false);
    setIsCreatingTasks(true);

    try {
      await deleteAllTasks();
      await createTasksFromPRD();
      setViewMode('kanban');
    } catch (error) {
      console.error('Failed to start fresh:', error);
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleContinue = () => {
    setShowExistingTasksDialog(false);
    setViewMode('kanban');
  };

  const handleBackToUpload = () => {
    setViewMode('upload');
    setParsedPRD(null);
  };

  if (viewMode === 'upload') {
    return <PRDUpload onPRDParsed={handlePRDParsed} />;
  }

  if (viewMode === 'prd' && parsedPRD) {
    return (
      <>
        <PRDViewer
          prd={parsedPRD}
          onStartProject={handleStartProject}
          onBack={handleBackToUpload}
          isLoading={isCreatingTasks}
        />

        {/* Existing Tasks Dialog */}
        {showExistingTasksDialog && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Existing Tasks Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You have <span className="font-semibold">{existingTaskCount} existing tasks</span> in your board.
                Would you like to continue where you left off, or start fresh with this PRD?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleContinue}
                  className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold
                    border-2 border-gray-900 dark:border-gray-100
                    hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                >
                  Continue with existing tasks
                </button>
                <button
                  onClick={handleStartFresh}
                  className="w-full py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl font-semibold
                    border-2 border-gray-300 dark:border-gray-600
                    hover:border-gray-900 dark:hover:border-gray-400 hover:shadow-3d-sm
                    transition-all"
                >
                  Start fresh (delete all tasks)
                </button>
                <button
                  onClick={() => setShowExistingTasksDialog(false)}
                  className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return <Board initialPRD={parsedPRD} onBackToPRD={() => setViewMode('prd')} />;
}

export default App;
