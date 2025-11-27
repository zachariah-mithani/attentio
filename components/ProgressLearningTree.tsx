import React, { useState } from 'react';
import { PathStage, Resource } from '../types';
import { updatePathProgress, PathWithProgress, NewAchievement } from '../services/pathService';
import { PenIcon, ArrowRightIcon, PlayCircleIcon, BookOpenIcon } from './Icons';

interface ProgressLearningTreeProps {
  pathId: number;
  path: PathStage[];
  progressMap: PathWithProgress['progressMap'];
  onProgressUpdate: (completedTopics: number, completedStages: number) => void;
  onNewAchievement?: (achievement: NewAchievement) => void;
}

export const ProgressLearningTree: React.FC<ProgressLearningTreeProps> = ({
  pathId,
  path,
  progressMap,
  onProgressUpdate,
  onNewAchievement
}) => {
  const [localProgress, setLocalProgress] = useState(progressMap);
  const [updating, setUpdating] = useState<string | null>(null);

  const isItemCompleted = (stageIndex: number, itemType: string, itemIndex: number) => {
    const key = `${stageIndex}-${itemType}-${itemIndex}`;
    return localProgress[key]?.is_completed === 1;
  };

  const handleToggleProgress = async (
    stageIndex: number,
    itemType: 'topic' | 'project' | 'resource',
    itemIndex: number
  ) => {
    const key = `${stageIndex}-${itemType}-${itemIndex}`;
    const currentlyCompleted = isItemCompleted(stageIndex, itemType, itemIndex);
    
    setUpdating(key);
    
    try {
      const result = await updatePathProgress(
        pathId,
        stageIndex,
        itemType,
        itemIndex,
        !currentlyCompleted
      );

      // Update local state
      setLocalProgress(prev => ({
        ...prev,
        [key]: {
          stage_index: stageIndex,
          item_type: itemType,
          item_index: itemIndex,
          is_completed: currentlyCompleted ? 0 : 1,
          completed_at: currentlyCompleted ? null : new Date().toISOString(),
          notes: null
        }
      }));

      onProgressUpdate(result.completedTopics, result.completedStages);

      // Show achievement toasts for any new achievements
      if (result.newAchievements && result.newAchievements.length > 0 && onNewAchievement) {
        result.newAchievements.forEach((achievement, idx) => {
          // Stagger the toasts
          setTimeout(() => {
            onNewAchievement(achievement);
          }, idx * 1500);
        });
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getStageProgress = (stageIndex: number, stage: PathStage) => {
    let completed = 0;
    const total = stage.keyTopics.length;
    
    stage.keyTopics.forEach((_, topicIndex) => {
      if (isItemCompleted(stageIndex, 'topic', topicIndex)) {
        completed++;
      }
    });
    
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  return (
    <div className="relative py-12 px-4">
      {/* Background Circuit Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-0 left-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <pattern id="circuit-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10 10h80v80h-80z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="10" cy="10" r="2" fill="currentColor" />
            <path d="M10 10 h 20 v 20" fill="none" stroke="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
        </svg>
      </div>

      {/* Start Node */}
      <div className="flex justify-center mb-16 animate-fade-up">
        <div className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] tracking-widest uppercase text-sm">
          Your Learning Path
        </div>
      </div>

      {/* Stages */}
      <div className="max-w-5xl mx-auto">
        {path.map((stage, stageIndex) => {
          const stageProgress = getStageProgress(stageIndex, stage);
          const isLast = stageIndex === path.length - 1;

          return (
            <div 
              key={stageIndex} 
              className="relative mb-20 animate-fade-up" 
              style={{ animationDelay: `${stageIndex * 200}ms` }}
            >
              {/* Vertical connector line */}
              {!isLast && (
                <div className="absolute left-1/2 top-full h-20 w-0.5 bg-emerald-500/20 -translate-x-1/2 z-0">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-emerald-500/50 blur-[2px]"></div>
                </div>
              )}

              {/* Stage Hub */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Stage number badge */}
                <div className="flex flex-col items-center mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-focus-base border-2 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] z-20 relative transition-colors ${
                    stageProgress.percent === 100 ? 'border-emerald-400 bg-emerald-500/20' : 'border-emerald-500'
                  }`}>
                    {stageProgress.percent === 100 ? (
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="font-mono text-lg font-bold text-emerald-400">0{stageIndex + 1}</span>
                    )}
                    <div className="absolute -inset-1 bg-emerald-500/20 blur-md rounded-xl -z-10"></div>
                  </div>
                  <div className="h-8 w-0.5 bg-emerald-500/30"></div>
                </div>

                {/* Main Stage Card */}
                <div className="tech-border bg-focus-surface p-6 rounded-lg max-w-2xl w-full text-center relative group hover:border-emerald-500/50 transition-colors">
                  {/* Progress indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-500/60">{stageProgress.completed}/{stageProgress.total}</span>
                    <div className="w-16 h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${stageProgress.percent}%` }}
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-emerald-300 transition-colors">
                    {stage.stageName}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
                    {stage.description}
                  </p>
                </div>

                {/* Topics with checkboxes */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl relative">
                  {stage.keyTopics.map((topic, topicIndex) => {
                    const isCompleted = isItemCompleted(stageIndex, 'topic', topicIndex);
                    const isUpdatingThis = updating === `${stageIndex}-topic-${topicIndex}`;

                    return (
                      <button
                        key={topicIndex}
                        onClick={() => handleToggleProgress(stageIndex, 'topic', topicIndex)}
                        disabled={isUpdatingThis}
                        className={`group relative flex items-center w-full bg-focus-dim border rounded-md p-4 transition-all text-left ${
                          isCompleted 
                            ? 'border-emerald-500/50 bg-emerald-500/10' 
                            : 'border-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                        }`}
                      >
                        {/* Custom checkbox */}
                        <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all shrink-0 ${
                          isCompleted 
                            ? 'border-emerald-500 bg-emerald-500' 
                            : 'border-emerald-500/30 group-hover:border-emerald-500/60'
                        }`}>
                          {isUpdatingThis ? (
                            <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                          ) : isCompleted ? (
                            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </div>

                        <span className={`text-sm font-medium transition-colors ${
                          isCompleted ? 'text-emerald-300 line-through opacity-70' : 'text-gray-300 group-hover:text-white'
                        }`}>
                          {topic}
                        </span>
                      </button>
                    );
                  })}

                  {/* Resources */}
                  {stage.resources && stage.resources.length > 0 && (
                    <div className="md:col-span-2 lg:col-span-3 mt-6">
                      <div className="text-[10px] text-emerald-500/60 font-mono tracking-[0.2em] mb-3 uppercase text-center">
                        Recommended Resources
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stage.resources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start p-3 rounded-md bg-focus-base border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group/res"
                          >
                            <div className={`mt-1 w-8 h-8 rounded flex items-center justify-center shrink-0 mr-3 
                              ${res.type === 'Video' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {res.type === 'Video' ? <PlayCircleIcon className="w-4 h-4" /> : <BookOpenIcon className="w-4 h-4" />}
                            </div>
                            <div className="flex-grow min-w-0">
                              <h5 className="text-sm font-bold text-gray-200 group-hover/res:text-emerald-300 truncate">{res.title}</h5>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{res.description}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project */}
                  <div className="md:col-span-2 lg:col-span-3 mt-4 flex justify-center">
                    <button
                      onClick={() => handleToggleProgress(stageIndex, 'project', 0)}
                      className={`relative w-full max-w-md group cursor-pointer ${
                        isItemCompleted(stageIndex, 'project', 0) ? 'opacity-80' : ''
                      }`}
                    >
                      <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg transition duration-500 blur ${
                        isItemCompleted(stageIndex, 'project', 0) ? 'opacity-50' : 'opacity-20 group-hover:opacity-50'
                      }`}></div>
                      <div className={`relative border rounded-lg p-5 flex items-center gap-4 ${
                        isItemCompleted(stageIndex, 'project', 0) 
                          ? 'bg-emerald-500/10 border-emerald-500/50' 
                          : 'bg-focus-base border-emerald-500/30'
                      }`}>
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                          isItemCompleted(stageIndex, 'project', 0)
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-emerald-500/30'
                        }`}>
                          {isItemCompleted(stageIndex, 'project', 0) && (
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-md text-emerald-400">
                          <PenIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-grow text-left">
                          <div className="text-[10px] font-bold text-emerald-500 font-mono uppercase tracking-widest mb-1">
                            {'>'} Mission Objective
                          </div>
                          <div className={`font-medium text-sm ${
                            isItemCompleted(stageIndex, 'project', 0) ? 'text-emerald-300 line-through' : 'text-white'
                          }`}>
                            {stage.suggestedProject}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* End Node */}
      <div className="flex justify-center mt-8 animate-fade-up">
        <div className="px-6 py-2 border border-emerald-500/30 text-emerald-500/60 font-mono text-xs tracking-[0.3em] uppercase rounded-full">
          Mastery Sequence Complete
        </div>
      </div>
    </div>
  );
};

