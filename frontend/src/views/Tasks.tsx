import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { axiosClient } from '../api/axiosClient';
import type { Project, Task, TaskStatus } from '../types';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']),
  project: z.string().min(1, 'Please select a project'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export const Tasks: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', priority: 'medium', status: 'todo', project: '' },
  });

  // Fetch projects list
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await axiosClient.get('/api/v1/projects/');
      return response.data;
    },
  });

  // React to projects load to set active project
  React.useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      setValue('project', projects[0].id);
    }
  }, [projects, selectedProjectId, setValue]);

  // Fetch tasks filtered by selected project
  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks', selectedProjectId],
    queryFn: async (): Promise<Task[]> => {
      if (!selectedProjectId) return [];
      const response = await axiosClient.get(`/api/v1/tasks/?project=${selectedProjectId}`);
      return response.data;
    },
    enabled: !!selectedProjectId,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await axiosClient.post('/api/v1/tasks/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] });
      setIsModalOpen(false);
      reset({ title: '', description: '', priority: 'medium', status: 'todo', project: selectedProjectId });
    },
  });

  // Move task status mutation (Kanban flow)
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const response = await axiosClient.patch(`/api/v1/tasks/${id}/`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/api/v1/tasks/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] });
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  const handleMoveStatus = (id: string, currentStatus: TaskStatus, direction: 'left' | 'right') => {
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];
    const currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < statuses.length) {
      updateTaskStatusMutation.mutate({ id, status: statuses[nextIndex] });
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete task "${title}"?`)) {
      deleteTaskMutation.mutate(id);
    }
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'in_review', title: 'In Review' },
    { id: 'done', title: 'Done' },
  ];

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    setValue('project', projId);
  };

  const isLoading = loadingProjects || loadingTasks;

  return (
    <div className="kanban-view-container">
      <div className="filter-bar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Workspace</span>
          <select value={selectedProjectId} onChange={handleProjectChange} className="filter-select">
            {projects.length === 0 && <option value="">No Projects Found</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            if (!selectedProjectId) {
              alert('Please create a project first.');
              return;
            }
            setIsModalOpen(true);
          }}
          disabled={!selectedProjectId}
          className="btn-primary"
          style={{ marginLeft: 'auto', alignSelf: 'flex-end', height: '40px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Task
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Kanban board...</div>
      ) : !selectedProjectId ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3>No Projects Available</h3>
          <p>Please navigate to the Projects tab and create your first workspace.</p>
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="column-header">
                  <span className="column-title">{col.title}</span>
                  <span className="column-count">{columnTasks.length}</span>
                </div>

                <div className="task-list">
                  {columnTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 8px', fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>Empty Column</div>
                  ) : (
                    columnTasks.map((task) => (
                      <div key={task.id} className="task-card">
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', gap: '8px' }}>
                          <span className="task-title">{task.title}</span>
                          <button
                            onClick={() => handleDelete(task.id, task.title)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer', padding: 0 }}
                            title="Delete task"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {task.description && <p className="task-desc">{task.description}</p>}
                        
                        <div className="task-meta">
                          <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                          
                          <div className="task-actions">
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => handleMoveStatus(task.id, task.status, 'left')}
                                className="task-action-btn"
                                title="Move back"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={() => handleMoveStatus(task.id, task.status, 'right')}
                                className="task-action-btn"
                                title="Move forward"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for creating tasks */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Task to Workspace</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              <div className="form-group">
                <label htmlFor="task_title">Task Title</label>
                <input
                  id="task_title"
                  type="text"
                  placeholder="e.g. Integrate auth tokens"
                  className="form-input"
                  {...register('title')}
                />
                {errors.title && <span className="form-error">{errors.title.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="task_desc">Description</label>
                <textarea
                  id="task_desc"
                  rows={3}
                  placeholder="Task details and deliverables..."
                  className="form-input"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  {...register('description')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task_priority">Priority</label>
                  <select id="task_priority" className="form-input" {...register('priority')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task_status">Status</label>
                  <select id="task_status" className="form-input" {...register('status')}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="btn-primary"
                >
                  {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
