import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { axiosClient } from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';
import type { Project, Task } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Fetch projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await axiosClient.get('/api/v1/projects/');
      return response.data;
    },
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const response = await axiosClient.get('/api/v1/tasks/');
      return response.data;
    },
  });

  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const inReviewCount = tasks.filter((t) => t.status === 'in_review').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const isLoading = loadingProjects || loadingTasks;

  return (
    <div className="dashboard-container">
      <div className="welcome-banner">
        <h2>Welcome back, {user?.first_name}! 👋</h2>
        <p>
          Manage your tasks, coordinate with team members, and harness the power of AI to supercharge your development processes.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card purple">
          <span className="stat-title">Active Projects</span>
          <span className="stat-value">{isLoading ? '...' : projects.length}</span>
        </div>
        <div className="stat-card yellow">
          <span className="stat-title">Tasks To Do</span>
          <span className="stat-value">{isLoading ? '...' : todoCount}</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-title">In Progress / Review</span>
          <span className="stat-value">{isLoading ? '...' : inProgressCount + inReviewCount}</span>
        </div>
        <div className="stat-card green">
          <span className="stat-title">Completed Tasks</span>
          <span className="stat-value">{isLoading ? '...' : doneCount}</span>
        </div>
      </div>

      <div className="dashboard-content-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '32px' }}>
        {/* Quick Start / Info */}
        <div className="dashboard-section" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Link to="/projects" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '20px', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>📁 New Project</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'left' }}>Create and set up dynamic workspaces for your workflows.</span>
            </Link>
            <Link to="/ai-copilot" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '20px', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>✨ Ask AI Assistant</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'left' }}>Generate subtasks and project timelines instantly using natural prompts.</span>
            </Link>
          </div>
        </div>

        {/* User Info / Connections */}
        <div className="dashboard-section" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Account Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <span style={{ color: '#fff', fontWeight: 500 }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>Authenticated</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>App Service:</span>
              <span style={{ color: '#fff', fontWeight: 500 }}>Django REST API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
