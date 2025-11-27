import React, { useState, useEffect } from 'react';
import { SavedPath, getUserPaths, archivePath, deletePath } from '../services/pathService';
import { MapIcon, ArrowRightIcon, PlayCircleIcon } from './Icons';

interface MyPathsProps {
  onContinuePath: (pathId: number) => void;
  onClose: () => void;
}

export const MyPaths: React.FC<MyPathsProps> = ({ onContinuePath, onClose }) => {
  const [paths, setPaths] = useState<SavedPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaths = async () => {
    try {
      setIsLoading(true);
      const data = await getUserPaths();
      setPaths(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const handleArchive = async (pathId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Archive this learning path? You can still access it later.')) return;
    
    try {
      await archivePath(pathId);
      setPaths(paths.filter(p => p.id !== pathId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (pathId: number, topic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Permanently delete "${topic}"? This will remove all progress and cannot be undone. You'll be able to create a new path for this topic.`)) return;
    
    try {
      await deletePath(pathId);
      setPaths(paths.filter(p => p.id !== pathId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string, progress: number) => {
    if (status === 'completed') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';
    if (progress > 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/40';
  };

  const getStatusLabel = (status: string, progress: number) => {
    if (status === 'completed') return 'COMPLETED';
    if (progress > 0) return 'IN PROGRESS';
    return 'NOT STARTED';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
        <div className="mt-6 font-mono text-emerald-500 text-sm animate-pulse tracking-[0.2em]">LOADING PATHS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 bg-red-950/30 px-6 py-4 rounded-sm border border-red-900 inline-block font-mono text-sm">
          <span className="font-bold mr-2">[ERROR]</span>{error}
        </p>
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <MapIcon className="w-10 h-10 text-emerald-500/50" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Learning Paths Yet</h3>
        <p className="text-gray-500 font-mono text-sm mb-6">Start a learning path to track your progress</p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors uppercase tracking-wider text-sm"
        >
          Create Your First Path
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paths.map((path, idx) => (
        <div
          key={path.id}
          onClick={() => onContinuePath(path.id)}
          className="group relative tech-border bg-focus-surface hover:bg-focus-dim rounded-lg p-6 cursor-pointer transition-all duration-300 animate-fade-up"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {/* Hover glow */}
          <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 rounded-lg transition-colors" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono font-bold border rounded-sm ${getStatusColor(path.status, path.progress_percent)}`}>
                    {getStatusLabel(path.status, path.progress_percent)}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">
                    {path.totalStages} STAGES • {path.totalTopics} TOPICS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors uppercase tracking-tight truncate">
                  {path.topic}
                </h3>
              </div>
              
              {/* Progress circle */}
              <div className="relative w-16 h-16 ml-4">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-emerald-500/10"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - path.progress_percent / 100)}`}
                    className="text-emerald-500 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-mono font-bold text-emerald-400">{path.progress_percent}%</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${path.progress_percent}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                <span>Started: {formatDate(path.startedAt)}</span>
                <span>Last active: {formatDate(path.lastAccessedAt)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleArchive(path.id, e)}
                  className="p-2 text-gray-600 hover:text-yellow-400 transition-colors"
                  title="Archive path"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDelete(path.id, path.topic, e)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                  title="Delete permanently"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div className="flex items-center text-emerald-500 text-xs font-mono font-bold uppercase tracking-widest">
                  <PlayCircleIcon className="w-4 h-4 mr-1" />
                  <span>Continue</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

