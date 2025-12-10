import React, { useState, useEffect, useRef } from 'react';
import { LearningPath, Unit, Level, Lesson, PathStage } from '../types';
import { updatePathProgress, PathWithProgress, NewAchievement } from '../services/pathService';
import { PenIcon } from './Icons';

interface ProgressLearningTreeProps {
  pathId: number;
  path: LearningPath | PathStage[];
  progressMap: PathWithProgress['progressMap'];
  onProgressUpdate: (completedTopics: number, completedStages: number) => void;
  onNewAchievement?: (achievement: NewAchievement) => void;
}

// Type guard to check if path is new Duolingo-style format
function isLearningPath(path: LearningPath | PathStage[]): path is LearningPath {
  return 'units' in path && Array.isArray((path as LearningPath).units);
}

// Animated XP counter
const XPCounter: React.FC<{ xp: number; totalXp: number }> = ({ xp, totalXp }) => {
  const [displayXp, setDisplayXp] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXp(Math.floor(xp * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [xp]);
  
  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold text-amber-400 font-mono">{displayXp}</div>
      <div className="text-sm text-gray-500">/ {totalXp} XP</div>
    </div>
  );
};

// Lesson Card Component
const LessonCard: React.FC<{
  lesson: Lesson;
  lessonIndex: number;
  levelIndex: number;
  unitIndex: number;
  isCompleted: boolean;
  isLocked: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  unitColor: string;
}> = ({ lesson, isCompleted, isLocked, isUpdating, onToggle, unitColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasVideo = lesson.resource?.videoId;
  
  return (
    <div className={`relative transition-all duration-300 ${isLocked ? 'opacity-50' : ''}`}>
      {/* Lesson Button */}
      <button
        onClick={() => !isLocked && setIsExpanded(!isExpanded)}
        disabled={isLocked}
        className={`w-full text-left rounded-xl p-4 transition-all duration-300 border-2 ${
          isCompleted 
            ? 'bg-emerald-500/10 border-emerald-500/50' 
            : isLocked
            ? 'bg-gray-800/50 border-gray-700/50 cursor-not-allowed'
            : 'bg-focus-surface border-gray-700 hover:border-opacity-70'
        }`}
        style={{ 
          borderColor: isCompleted ? undefined : isLocked ? undefined : unitColor + '40',
          ['--hover-color' as string]: unitColor
        }}
      >
        <div className="flex items-center gap-4">
          {/* Completion Circle */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isCompleted 
              ? 'bg-emerald-500 text-black' 
              : isLocked 
              ? 'bg-gray-700 text-gray-500'
              : 'border-2'
          }`}
          style={{ borderColor: !isCompleted && !isLocked ? unitColor : undefined }}
          >
            {isUpdating ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isCompleted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : isLocked ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="text-sm font-bold" style={{ color: unitColor }}>▶</span>
            )}
          </div>
          
          {/* Lesson Info */}
          <div className="flex-grow min-w-0">
            <h4 className={`font-semibold text-sm ${isCompleted ? 'text-emerald-300' : isLocked ? 'text-gray-500' : 'text-white'}`}>
              {lesson.title}
            </h4>
            <p className="text-xs text-gray-500 truncate">{lesson.description}</p>
          </div>
          
          {/* XP Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
            isCompleted 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            +{lesson.xpReward} XP
          </div>
          
          {/* Expand Arrow */}
          {!isLocked && (
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      
      {/* Expanded Video Section */}
      {isExpanded && !isLocked && (
        <div className="mt-2 rounded-xl overflow-hidden bg-black/50 border border-gray-800">
          {hasVideo ? (
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${lesson.resource.videoId}?rel=0`}
                title={lesson.resource.title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a 
              href={lesson.resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 text-center hover:bg-gray-800/50 transition-colors"
            >
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-400 text-sm">Click to search for this lesson</p>
            </a>
          )}
          
          {/* Video Info & Complete Button */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 font-mono">
                {lesson.resource.views !== '-' && <span>{lesson.resource.views}</span>}
                {lesson.resource.durationMin > 0 && <span> • {lesson.resource.durationMin}m</span>}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  isCompleted
                    ? 'bg-gray-700 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                    : 'text-black hover:opacity-90'
                }`}
                style={{ backgroundColor: isCompleted ? undefined : unitColor }}
              >
                {isUpdating ? 'Saving...' : isCompleted ? 'Mark Incomplete' : 'Complete Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Level Component (like a Duolingo skill)
const LevelNode: React.FC<{
  level: Level;
  levelIndex: number;
  unitIndex: number;
  unitColor: string;
  progressMap: PathWithProgress['progressMap'];
  updating: string | null;
  onToggleLesson: (unitIndex: number, levelIndex: number, lessonIndex: number) => void;
  onToggleProject: (unitIndex: number, levelIndex: number) => void;
  isItemCompleted: (unitIndex: number, levelIndex: number, lessonIndex: number, type: string) => boolean;
  previousLevelComplete: boolean;
}> = ({ 
  level, 
  levelIndex, 
  unitIndex, 
  unitColor, 
  progressMap, 
  updating, 
  onToggleLesson, 
  onToggleProject,
  isItemCompleted,
  previousLevelComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate level progress
  const completedLessons = level.lessons.filter((_, i) => 
    isItemCompleted(unitIndex, levelIndex, i, 'lesson')
  ).length;
  const totalLessons = level.lessons.length;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);
  const isLevelComplete = completedLessons === totalLessons;
  const isLocked = !previousLevelComplete && levelIndex > 0;
  
  // Calculate earned XP for this level
  const earnedXp = level.lessons.reduce((sum, lesson, i) => 
    isItemCompleted(unitIndex, levelIndex, i, 'lesson') ? sum + lesson.xpReward : sum
  , 0);
  
  return (
    <div className={`relative ${isLocked ? 'opacity-60' : ''}`}>
      {/* Level Button (Duolingo-style circle) */}
      <button
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        disabled={isLocked}
        className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-4 ${
          isLevelComplete 
            ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
            : isLocked
            ? 'bg-gray-800 border-gray-700 cursor-not-allowed'
            : 'hover:scale-110 shadow-lg'
        }`}
        style={{ 
          backgroundColor: !isLevelComplete && !isLocked ? unitColor : undefined,
          borderColor: !isLevelComplete && !isLocked ? unitColor : undefined,
          boxShadow: !isLevelComplete && !isLocked ? `0 0 20px ${unitColor}40` : undefined
        }}
      >
        {/* Progress ring */}
        {!isLocked && !isLevelComplete && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="4"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercent / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
        )}
        
        {/* Icon */}
        <span className="text-2xl relative z-10">
          {isLocked ? '🔒' : isLevelComplete ? '⭐' : level.icon}
        </span>
        
        {/* Level number badge */}
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          isLevelComplete ? 'bg-amber-400 text-black' : 'bg-gray-900 text-white border-2'
        }`}
        style={{ borderColor: !isLevelComplete ? unitColor : undefined }}
        >
          {level.levelNumber}
        </div>
      </button>
      
      {/* Level Title */}
      <div className="mt-3 text-center max-w-[120px]">
        <h4 className={`text-sm font-semibold ${isLocked ? 'text-gray-600' : 'text-white'}`}>
          {level.title}
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">
          {completedLessons}/{totalLessons} lessons
        </p>
      </div>
      
      {/* Expanded Lessons Panel */}
      {isOpen && !isLocked && (
        <div className="absolute left-1/2 top-full mt-4 -translate-x-1/2 w-[400px] max-w-[90vw] z-50 animate-fade-up">
          <div className="bg-focus-base border-2 rounded-2xl p-4 shadow-2xl"
            style={{ borderColor: unitColor + '40' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white">{level.title}</h3>
                <p className="text-xs text-gray-500">{level.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-400">{earnedXp}/{level.totalXp} XP</div>
                <div className="text-xs text-gray-500">{progressPercent}% complete</div>
              </div>
            </div>
            
            {/* Lessons List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {level.lessons.map((lesson, lessonIndex) => {
                // Lessons unlock sequentially within a level
                const previousLessonComplete = lessonIndex === 0 || isItemCompleted(unitIndex, levelIndex, lessonIndex - 1, 'lesson');
                
                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    lessonIndex={lessonIndex}
                    levelIndex={levelIndex}
                    unitIndex={unitIndex}
                    isCompleted={isItemCompleted(unitIndex, levelIndex, lessonIndex, 'lesson')}
                    isLocked={!previousLessonComplete}
                    isUpdating={updating === `${unitIndex}-${levelIndex}-lesson-${lessonIndex}`}
                    onToggle={() => onToggleLesson(unitIndex, levelIndex, lessonIndex)}
                    unitColor={unitColor}
                  />
                );
              })}
              
              {/* Challenge Project */}
              {level.challengeProject && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => onToggleProject(unitIndex, levelIndex)}
                    disabled={!isLevelComplete}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
                      isItemCompleted(unitIndex, levelIndex, 0, 'project')
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : isLevelComplete
                        ? 'border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5'
                        : 'border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎯</div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Challenge Project</div>
                        <div className={`text-sm ${isItemCompleted(unitIndex, levelIndex, 0, 'project') ? 'text-amber-300 line-through' : 'text-white'}`}>
                          {level.challengeProject}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Unit Component
const UnitSection: React.FC<{
  unit: Unit;
  unitIndex: number;
  progressMap: PathWithProgress['progressMap'];
  updating: string | null;
  onToggleLesson: (unitIndex: number, levelIndex: number, lessonIndex: number) => void;
  onToggleProject: (unitIndex: number, levelIndex: number) => void;
  onToggleBossChallenge: (unitIndex: number) => void;
  isItemCompleted: (unitIndex: number, levelIndex: number, lessonIndex: number, type: string) => boolean;
  previousUnitComplete: boolean;
}> = ({ 
  unit, 
  unitIndex, 
  progressMap, 
  updating, 
  onToggleLesson, 
  onToggleProject,
  onToggleBossChallenge,
  isItemCompleted,
  previousUnitComplete
}) => {
  const isUnitLocked = !previousUnitComplete && unitIndex > 0;
  
  // Calculate unit progress
  const totalLessons = unit.levels.reduce((sum, level) => sum + level.lessons.length, 0);
  const completedLessons = unit.levels.reduce((sum, level, levelIndex) => 
    sum + level.lessons.filter((_, lessonIndex) => 
      isItemCompleted(unitIndex, levelIndex, lessonIndex, 'lesson')
    ).length
  , 0);
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);
  
  // Check if each level is complete
  const isLevelComplete = (levelIndex: number) => {
    const level = unit.levels[levelIndex];
    return level.lessons.every((_, lessonIndex) => 
      isItemCompleted(unitIndex, levelIndex, lessonIndex, 'lesson')
    );
  };
  
  const isUnitComplete = unit.levels.every((_, levelIndex) => isLevelComplete(levelIndex));
  
  return (
    <div className={`relative ${isUnitLocked ? 'opacity-40' : ''}`}>
      {/* Unit Header */}
      <div 
        className="relative mb-8 p-6 rounded-2xl border-2 overflow-hidden"
        style={{ 
          borderColor: unit.color + '40',
          background: `linear-gradient(135deg, ${unit.color}10 0%, transparent 50%)`
        }}
      >
        {/* Unit number badge */}
        <div 
          className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
          style={{ backgroundColor: unit.color, color: 'black' }}
        >
          {unit.unitNumber}
        </div>
        
        <div className="ml-14">
          <h2 className="text-2xl font-bold text-white mb-1">{unit.title}</h2>
          <p className="text-sm text-gray-400">{unit.description}</p>
          
          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-grow h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: unit.color }}
              />
            </div>
            <span className="text-sm font-mono" style={{ color: unit.color }}>
              {progressPercent}%
            </span>
          </div>
        </div>
        
        {/* Lock overlay */}
        {isUnitLocked && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <p className="text-gray-400 text-sm">Complete previous unit to unlock</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Levels Path (Duolingo-style winding path) */}
      {!isUnitLocked && (
        <div className="relative pb-8">
          {/* Path connector */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
            style={{ backgroundColor: unit.color + '20' }}
          />
          
          {/* Levels */}
          <div className="relative flex flex-col items-center gap-12">
            {unit.levels.map((level, levelIndex) => {
              // Alternate left/right positioning for visual interest
              const isLeft = levelIndex % 2 === 0;
              const previousComplete = levelIndex === 0 || isLevelComplete(levelIndex - 1);
              
              return (
                <div 
                  key={level.id}
                  className={`relative ${isLeft ? 'self-start ml-[20%]' : 'self-end mr-[20%]'}`}
                  style={{ animationDelay: `${levelIndex * 100}ms` }}
                >
                  {/* Connector dot */}
                  <div 
                    className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2"
                    style={{ 
                      backgroundColor: unit.color,
                      [isLeft ? 'right' : 'left']: '-40px'
                    }}
                  />
                  
                  <LevelNode
                    level={level}
                    levelIndex={levelIndex}
                    unitIndex={unitIndex}
                    unitColor={unit.color}
                    progressMap={progressMap}
                    updating={updating}
                    onToggleLesson={onToggleLesson}
                    onToggleProject={onToggleProject}
                    isItemCompleted={isItemCompleted}
                    previousLevelComplete={previousComplete}
                  />
                </div>
              );
            })}
            
            {/* Boss Challenge */}
            {unit.bossChallenge && (
              <div className="relative mt-8">
                <button
                  onClick={() => onToggleBossChallenge(unitIndex)}
                  disabled={!isUnitComplete}
                  className={`relative px-8 py-4 rounded-xl border-2 transition-all ${
                    isItemCompleted(unitIndex, -1, 0, 'boss')
                      ? 'bg-amber-500/20 border-amber-500'
                      : isUnitComplete
                      ? 'border-amber-500/50 hover:border-amber-500 hover:bg-amber-500/10'
                      : 'border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">👑</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Unit Boss Challenge</div>
                      <div className={`font-semibold ${isItemCompleted(unitIndex, -1, 0, 'boss') ? 'text-amber-300 line-through' : 'text-white'}`}>
                        {unit.bossChallenge}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Legacy component for old path format
const LegacyProgressTree: React.FC<{
  pathId: number;
  path: PathStage[];
  progressMap: PathWithProgress['progressMap'];
  onProgressUpdate: (completedTopics: number, completedStages: number) => void;
  onNewAchievement?: (achievement: NewAchievement) => void;
}> = ({ pathId, path, progressMap, onProgressUpdate, onNewAchievement }) => {
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

      if (result.newAchievements && result.newAchievements.length > 0 && onNewAchievement) {
        result.newAchievements.forEach((achievement, idx) => {
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

      <div className="flex justify-center mb-16 animate-fade-up">
        <div className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] tracking-widest uppercase text-sm">
          Your Learning Path
        </div>
      </div>

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
              {!isLast && (
                <div className="absolute left-1/2 top-full h-20 w-0.5 bg-emerald-500/20 -translate-x-1/2 z-0">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-emerald-500/50 blur-[2px]"></div>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center">
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

                <div className="tech-border bg-focus-surface p-6 rounded-lg max-w-2xl w-full text-center relative group hover:border-emerald-500/50 transition-colors">
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

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
                  {stage.keyTopics.map((topic, topicIndex) => {
                    const topicName = typeof topic === 'string' ? topic : topic.name;
                    const resource = typeof topic === 'object' ? topic.resource : null;
                    const hasVideo = resource?.videoId;
                    const isCompleted = isItemCompleted(stageIndex, 'topic', topicIndex);
                    const isUpdatingThis = updating === `${stageIndex}-topic-${topicIndex}`;

                    return (
                      <div
                        key={topicIndex}
                        className={`group relative w-full bg-focus-dim border rounded-lg overflow-hidden transition-all ${
                          isCompleted 
                            ? 'border-emerald-500/50 bg-emerald-500/10' 
                            : 'border-emerald-500/10 hover:border-emerald-500/40'
                        }`}
                      >
                        {hasVideo && (
                          <div className="relative w-full aspect-video bg-black">
                            <iframe
                              src={`https://www.youtube.com/embed/${resource.videoId}?rel=0`}
                              title={resource.title}
                              className="absolute inset-0 w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}

                        <div className="p-4">
                          <button
                            onClick={() => handleToggleProgress(stageIndex, 'topic', topicIndex)}
                            disabled={isUpdatingThis}
                            className="flex items-center w-full text-left"
                          >
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
                              {topicName}
                            </span>
                          </button>

                          {resource && (
                            <div className="mt-2 pt-2 border-t border-emerald-500/10">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-400 hover:text-emerald-400 transition-colors line-clamp-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {resource.title}
                              </a>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-1">
                                {resource.views !== '-' && <span>{resource.views}</span>}
                                {resource.durationMin > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{resource.durationMin}m</span>
                                  </>
                                )}
                                {resource.description && (
                                  <>
                                    <span>•</span>
                                    <span className="text-gray-600">{resource.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

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

      <div className="flex justify-center mt-8 animate-fade-up">
        <div className="px-6 py-2 border border-emerald-500/30 text-emerald-500/60 font-mono text-xs tracking-[0.3em] uppercase rounded-full">
          Mastery Sequence Complete
        </div>
      </div>
    </div>
  );
};

// Main Component
export const ProgressLearningTree: React.FC<ProgressLearningTreeProps> = ({
  pathId,
  path,
  progressMap,
  onProgressUpdate,
  onNewAchievement
}) => {
  // Check if it's the new format
  if (!isLearningPath(path)) {
    // Use legacy component for old paths
    return (
      <LegacyProgressTree
        pathId={pathId}
        path={path}
        progressMap={progressMap}
        onProgressUpdate={onProgressUpdate}
        onNewAchievement={onNewAchievement}
      />
    );
  }
  
  const [localProgress, setLocalProgress] = useState(progressMap);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Calculate total XP earned
  const totalEarnedXp = path.units.reduce((unitSum, unit, unitIndex) => 
    unitSum + unit.levels.reduce((levelSum, level, levelIndex) => 
      levelSum + level.lessons.reduce((lessonSum, lesson, lessonIndex) => {
        const key = `${unitIndex}-${levelIndex}-lesson-${lessonIndex}`;
        return lessonSum + (localProgress[key]?.is_completed === 1 ? lesson.xpReward : 0);
      }, 0)
    , 0)
  , 0);
  
  const isItemCompleted = (unitIndex: number, levelIndex: number, lessonIndex: number, type: string) => {
    const key = `${unitIndex}-${levelIndex}-${type}-${lessonIndex}`;
    return localProgress[key]?.is_completed === 1;
  };
  
  const handleToggleLesson = async (unitIndex: number, levelIndex: number, lessonIndex: number) => {
    const key = `${unitIndex}-${levelIndex}-lesson-${lessonIndex}`;
    const currentlyCompleted = isItemCompleted(unitIndex, levelIndex, lessonIndex, 'lesson');
    
    setUpdating(key);
    
    try {
      // Map to the old progress format for backend compatibility
      // stageIndex = unitIndex * 100 + levelIndex (to create unique stage IDs)
      const stageIndex = unitIndex * 100 + levelIndex;
      
      const result = await updatePathProgress(
        pathId,
        stageIndex,
        'topic',
        lessonIndex,
        !currentlyCompleted
      );

      setLocalProgress(prev => ({
        ...prev,
        [key]: {
          stage_index: stageIndex,
          item_type: 'lesson',
          item_index: lessonIndex,
          is_completed: currentlyCompleted ? 0 : 1,
          completed_at: currentlyCompleted ? null : new Date().toISOString(),
          notes: null
        }
      }));

      onProgressUpdate(result.completedTopics, result.completedStages);

      if (result.newAchievements && result.newAchievements.length > 0 && onNewAchievement) {
        result.newAchievements.forEach((achievement, idx) => {
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
  
  const handleToggleProject = async (unitIndex: number, levelIndex: number) => {
    const key = `${unitIndex}-${levelIndex}-project-0`;
    const currentlyCompleted = isItemCompleted(unitIndex, levelIndex, 0, 'project');
    
    setUpdating(key);
    
    try {
      const stageIndex = unitIndex * 100 + levelIndex;
      
      const result = await updatePathProgress(
        pathId,
        stageIndex,
        'project',
        0,
        !currentlyCompleted
      );

      setLocalProgress(prev => ({
        ...prev,
        [key]: {
          stage_index: stageIndex,
          item_type: 'project',
          item_index: 0,
          is_completed: currentlyCompleted ? 0 : 1,
          completed_at: currentlyCompleted ? null : new Date().toISOString(),
          notes: null
        }
      }));

      onProgressUpdate(result.completedTopics, result.completedStages);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setUpdating(null);
    }
  };
  
  const handleToggleBossChallenge = async (unitIndex: number) => {
    const key = `${unitIndex}--1-boss-0`;
    const currentlyCompleted = isItemCompleted(unitIndex, -1, 0, 'boss');
    
    setUpdating(key);
    
    try {
      const stageIndex = unitIndex * 100 + 99; // Special stage index for boss challenges
      
      const result = await updatePathProgress(
        pathId,
        stageIndex,
        'project',
        0,
        !currentlyCompleted
      );

      setLocalProgress(prev => ({
        ...prev,
        [key]: {
          stage_index: stageIndex,
          item_type: 'boss',
          item_index: 0,
          is_completed: currentlyCompleted ? 0 : 1,
          completed_at: currentlyCompleted ? null : new Date().toISOString(),
          notes: null
        }
      }));

      onProgressUpdate(result.completedTopics, result.completedStages);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setUpdating(null);
    }
  };
  
  // Check if each unit is complete
  const isUnitComplete = (unitIndex: number) => {
    const unit = path.units[unitIndex];
    return unit.levels.every((level, levelIndex) => 
      level.lessons.every((_, lessonIndex) => 
        isItemCompleted(unitIndex, levelIndex, lessonIndex, 'lesson')
      )
    );
  };

  return (
    <div className="relative py-12 px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #10b981 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Header with XP Counter */}
      <div className="flex flex-col items-center mb-16 animate-fade-up">
        <div className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-6">
          <h1 className="text-2xl tracking-tight">{path.topic}</h1>
        </div>
        
        {/* XP Progress */}
        <div className="flex items-center gap-6 bg-focus-surface border border-amber-500/20 rounded-full px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <XPCounter xp={totalEarnedXp} totalXp={path.totalXp} />
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div className="text-sm text-gray-400">
            <span className="text-white font-bold">{path.totalUnits}</span> Units • 
            <span className="text-white font-bold"> {path.totalLevels}</span> Levels • 
            <span className="text-white font-bold"> {path.totalLessons}</span> Lessons
          </div>
        </div>
      </div>
      
      {/* Units */}
      <div className="max-w-4xl mx-auto space-y-16">
        {path.units.map((unit, unitIndex) => {
          const previousComplete = unitIndex === 0 || isUnitComplete(unitIndex - 1);
          
          return (
            <UnitSection
              key={unit.id}
              unit={unit}
              unitIndex={unitIndex}
              progressMap={localProgress}
              updating={updating}
              onToggleLesson={handleToggleLesson}
              onToggleProject={handleToggleProject}
              onToggleBossChallenge={handleToggleBossChallenge}
              isItemCompleted={isItemCompleted}
              previousUnitComplete={previousComplete}
            />
          );
        })}
      </div>
      
      {/* Completion Badge */}
      <div className="flex justify-center mt-16 animate-fade-up">
        <div className="px-8 py-3 border-2 border-dashed border-amber-500/30 text-amber-500/60 font-mono text-sm tracking-[0.2em] uppercase rounded-full">
          🏆 Complete all units to achieve mastery
        </div>
      </div>
    </div>
  );
};

export default ProgressLearningTree;
