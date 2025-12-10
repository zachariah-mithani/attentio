import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ViewMode, AppState, Resource, PathStage, LearningPath, SkillLevel, SKILL_LEVELS } from './types';
import { fetchQuickResources, fetchLearningPath, fetchSearchSuggestions } from './services/geminiService';
import { saveLearningPath, getPathWithProgress, PathWithProgress } from './services/pathService';
import {
  SparklesIcon, ZapIcon, MapIcon,
  ArrowRightIcon, PlayCircleIcon, BookOpenIcon, SearchIcon, PenIcon, UserIcon,
  MicIcon, ExternalLinkIcon
} from './components/Icons';
import { useAuth } from './contexts/AuthContext';
import { AuthModal, UserMenu } from './components/AuthModal';
import { MyPaths } from './components/MyPaths';
import { ProgressLearningTree } from './components/ProgressLearningTree';
import { Certificate } from './components/Certificate';
import { AchievementsModal, AchievementToast } from './components/Achievements';
import { StatsPage } from './components/StatsPage';

// --- Utilities ---

const getYouTubeVideoId = (url: string): string | null => {
  if (url.includes('youtube.com/results')) return null; // Explicitly ignore search results
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- Sub-components ---

const ModeCard: React.FC<{
  title: string;
  desc: string;
  icon: any;
  active: boolean;
  onClick: () => void
}> = ({
  title,
  desc,
  icon: Icon,
  active,
  onClick
}) => (
    <button
      onClick={onClick}
      className="group relative w-full h-72 text-left transition-all duration-300 transform hover:-translate-y-2"
    >
      {/* Tech Border Container */}
      <div className="absolute inset-0 tech-border rounded-xl"></div>

      {/* Inner Glow */}
      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-500 rounded-xl"></div>

      <div className="relative z-10 h-full flex flex-col p-8 justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-lg bg-focus-dim border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:text-emerald-200 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
              <Icon className="w-7 h-7" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 font-mono text-xs tracking-widest">[ACTIVE]</div>
          </div>

          <h3 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter group-hover:text-emerald-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-400 font-medium leading-relaxed border-l-2 border-emerald-500/20 pl-4 group-hover:border-emerald-500 group-hover:text-gray-300 transition-all">
            {desc}
          </p>
        </div>

        <div className="flex items-center text-emerald-500 text-xs font-mono font-bold uppercase tracking-widest mt-4">
          <span className="group-hover:mr-2 transition-all">Initialize</span>
          <ArrowRightIcon className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100" />
        </div>
      </div>
    </button>
  );

const ResourceCard: React.FC<{ resource: Resource, index: number }> = ({ resource, index }) => {
  const videoId = resource.type === 'Video' ? getYouTubeVideoId(resource.url) : null;

  const CardContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono font-bold border rounded-sm
            ${resource.type === 'Video' ? 'bg-red-500/10 border-red-500/40 text-red-400' :
            resource.type === 'Course' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
              'bg-blue-500/10 border-blue-500/40 text-blue-400'
          }`}>
          {resource.type}
        </span>
        <div className="text-right">
          <span className="block text-xs font-mono text-gray-400">{resource.durationMin} MIN</span>
        </div>
      </div>

      <h4 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors leading-tight">
        {resource.title}
      </h4>

      <p className="text-sm text-gray-400 mb-6 flex-grow line-clamp-3 leading-relaxed">
        {resource.description}
      </p>

      <div className="flex items-center justify-between pt-2 mt-auto">
        <span className="text-[10px] text-emerald-500/60 font-mono uppercase tracking-wider flex items-center">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
          {resource.views}
        </span>
        <span className="text-[10px] text-gray-600 font-mono">
          {resource.publishedDate}
        </span>
      </div>
    </div>
  );

  const cardClasses = "group relative tech-border bg-focus-surface hover:bg-focus-dim rounded-lg overflow-hidden transition-all duration-300 flex flex-col h-full";
  const animationStyle = { animationDelay: `${index * 100}ms` };

  // If it's a video with a valid ID, render the iframe embed card
  if (videoId) {
    return (
      <div className={cardClasses} style={animationStyle}>
        <div className="w-full aspect-video bg-black relative z-10 border-b border-emerald-500/20">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={resource.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0"
          ></iframe>
        </div>
        <div className="p-5 flex flex-col flex-grow relative z-0">
          <CardContent />
        </div>
      </div>
    );
  }

  // Otherwise, render a clickable link card
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClasses}
      style={animationStyle}
    >
      <div className="p-5 flex flex-col flex-grow">
        <CardContent />
      </div>
      {/* Corner accents */}
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-emerald-500/10 to-transparent"></div>
    </a>
  );
};

// --- Tree Visualization Components ---

const StageNode: React.FC<{ stage: PathStage, index: number, isLast: boolean }> = ({ stage, index, isLast }) => {
  return (
    <div className="relative mb-20 animate-fade-up" style={{ animationDelay: `${index * 200}ms` }}>
      {/* Main Vertical Line (Spine) */}
      {!isLast && (
        <div className="absolute left-1/2 top-full h-20 w-0.5 bg-emerald-500/20 -translate-x-1/2 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-emerald-500/50 blur-[2px]"></div>
        </div>
      )}

      {/* Stage Hub Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Stage ID Badge */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-focus-base border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] z-20 relative">
            <span className="font-mono text-lg font-bold text-emerald-400">0{index + 1}</span>
            <div className="absolute -inset-1 bg-emerald-500/20 blur-md rounded-xl -z-10"></div>
          </div>
          <div className="h-8 w-0.5 bg-emerald-500/30"></div>
        </div>

        {/* Main Stage Card */}
        <div className="tech-border bg-focus-surface p-6 rounded-lg max-w-2xl w-full text-center relative group hover:border-emerald-500/50 transition-colors">
          {/* Connector Lines to Sub-nodes */}
          <div className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 w-3/4 h-8 border-x border-b border-emerald-500/20 rounded-b-2xl -z-10"></div>
          <div className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 h-8 w-0.5 bg-emerald-500/20"></div>

          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-emerald-300 transition-colors">
            {stage.stageName}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
            {stage.description}
          </p>
        </div>

        {/* Branching Nodes Container */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
          {/* Sub-topic Nodes with Embedded Videos */}
          {stage.keyTopics.map((topic, i) => {
            const topicName = typeof topic === 'string' ? topic : topic.name;
            const resource = typeof topic === 'object' ? topic.resource : null;
            const hasVideo = resource?.videoId;

            return (
              <div key={i} className="group relative flex flex-col">
                {/* Visual Connector Line for Desktop */}
                <div className="hidden md:block absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-emerald-500/20"></div>

                {/* Topic Card with Embedded Video */}
                <div className="w-full bg-focus-dim border border-emerald-500/10 rounded-lg overflow-hidden hover:border-emerald-500/40 transition-all">
                  {/* Video Embed */}
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

                  {/* Topic Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                      <span className="text-[10px] text-emerald-500/40 font-mono">NODE {index + 1}.{i + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors block">{topicName}</span>

                    {/* Video metadata */}
                    {resource && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/10">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-emerald-400 transition-colors line-clamp-1"
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
              </div>
            );
          })}

          {/* Project Node (Spans full width or stands out) */}
          <div className="md:col-span-2 lg:col-span-3 mt-4 flex justify-center">
            <div className="relative w-full max-w-md group cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg opacity-20 group-hover:opacity-50 blur transition duration-500"></div>
              <div className="relative bg-focus-base border border-emerald-500/30 rounded-lg p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-md text-emerald-400">
                  <PenIcon className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="text-[10px] font-bold text-emerald-500 font-mono uppercase tracking-widest mb-1">
                    {'>'} Mission Objective
                  </div>
                  <div className="text-white font-medium text-sm">
                    {stage.suggestedProject}
                  </div>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Expandable Level Preview Component
const LevelPreview: React.FC<{ 
  level: LearningPath['units'][0]['levels'][0]; 
  unitColor: string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ level, unitColor, isExpanded, onToggle }) => {
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden bg-focus-dim/50">
      {/* Level Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-2xl">{level.icon}</span>
        <div className="flex-grow">
          <h4 className="font-semibold text-white">{level.title}</h4>
          <p className="text-xs text-gray-500">{level.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
            {level.totalXp} XP
          </span>
          <span className="text-xs text-gray-500">{level.lessons.length} lessons</span>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* Expanded Lessons */}
      {isExpanded && (
        <div className="border-t border-gray-700 bg-black/20">
          <div className="p-4 space-y-3">
            {level.lessons.map((lesson, lessonIndex) => (
              <div 
                key={lesson.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-focus-surface border border-gray-800"
              >
                {/* Lesson number */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: unitColor + '20', color: unitColor }}
                >
                  {lessonIndex + 1}
                </div>
                
                {/* Lesson info */}
                <div className="flex-grow min-w-0">
                  <h5 className="font-medium text-white text-sm">{lesson.title}</h5>
                  <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>
                  
                  {/* Video preview if available */}
                  {lesson.resource?.videoId && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                        <path fill="white" d="M9.545 15.568V8.432L15.818 12z"/>
                      </svg>
                      <span className="truncate">{lesson.resource.title}</span>
                      {lesson.resource.durationMin > 0 && (
                        <span className="text-gray-600">• {lesson.resource.durationMin}m</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* XP badge */}
                <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded shrink-0">
                  +{lesson.xpReward} XP
                </div>
              </div>
            ))}
            
            {/* Challenge project */}
            {level.challengeProject && (
              <div className="mt-4 p-3 rounded-lg border-2 border-dashed border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <span>🎯</span>
                  <span className="font-semibold">Level Challenge:</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{level.challengeProject}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Preview component for new Duolingo-style learning path (before saving)
const LearningPathPreview: React.FC<{ path: LearningPath }> = ({ path }) => {
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  
  const toggleLevel = (levelId: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(levelId)) {
        next.delete(levelId);
      } else {
        next.add(levelId);
      }
      return next;
    });
  };
  
  const expandAll = () => {
    const allIds = path.units.flatMap(u => u.levels.map(l => l.id));
    setExpandedLevels(new Set(allIds));
  };
  
  const collapseAll = () => {
    setExpandedLevels(new Set());
  };
  
  // Find skill level config for display
  const skillLevelConfig = SKILL_LEVELS.find(s => s.id === path.skillLevel);
  
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
      
      {/* Header */}
      <div className="flex flex-col items-center mb-12 animate-fade-up">
        <div className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-6">
          <h1 className="text-2xl tracking-tight capitalize">{path.topic}</h1>
        </div>
        
        {/* Skill Level Badge */}
        {skillLevelConfig && (
          <div className="mb-4 px-4 py-2 bg-focus-surface border border-purple-500/30 rounded-full flex items-center gap-2">
            <span className="text-xl">{skillLevelConfig.icon}</span>
            <span className="text-purple-400 font-semibold">{skillLevelConfig.label}</span>
            <span className="text-gray-500 text-sm">• {path.estimatedHours}+ hours</span>
          </div>
        )}
        
        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-4 bg-focus-surface border border-amber-500/20 rounded-2xl px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">{path.totalXp}</div>
            <div className="text-sm text-gray-500">XP</div>
          </div>
          <div className="h-8 w-px bg-gray-700 hidden sm:block" />
          <div className="text-sm text-gray-400 flex flex-wrap gap-2 justify-center">
            <span><span className="text-white font-bold">{path.totalUnits}</span> Units</span>
            <span>•</span>
            <span><span className="text-white font-bold">{path.totalLevels}</span> Levels</span>
            <span>•</span>
            <span><span className="text-white font-bold">{path.totalLessons}</span> Lessons</span>
          </div>
        </div>
        
        {/* Expand/Collapse buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-mono text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-mono text-gray-400 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>
      
      {/* Units with Expanded Levels */}
      <div className="max-w-4xl mx-auto space-y-8">
        {path.units.map((unit, unitIndex) => (
          <div 
            key={unit.id}
            className="animate-fade-up"
            style={{ animationDelay: `${unitIndex * 100}ms` }}
          >
            {/* Unit Header */}
            <div 
              className="relative p-6 rounded-t-2xl border-2 border-b-0"
              style={{ 
                borderColor: unit.color + '40',
                background: `linear-gradient(135deg, ${unit.color}15 0%, transparent 50%)`
              }}
            >
              {/* Unit number badge */}
              <div 
                className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg"
                style={{ backgroundColor: unit.color, color: 'black' }}
              >
                {unit.unitNumber}
              </div>
              
              <div className="ml-14">
                <h2 className="text-2xl font-bold text-white mb-1">{unit.title}</h2>
                <p className="text-sm text-gray-400">{unit.description}</p>
                
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    {unit.levels.length} levels • {unit.levels.reduce((sum, l) => sum + l.lessons.length, 0)} lessons
                  </span>
                </div>
              </div>
            </div>
            
            {/* Levels List */}
            <div 
              className="rounded-b-2xl border-2 border-t-0 p-4 space-y-3"
              style={{ borderColor: unit.color + '40' }}
            >
              {unit.levels.map((level) => (
                <LevelPreview
                  key={level.id}
                  level={level}
                  unitColor={unit.color}
                  isExpanded={expandedLevels.has(level.id)}
                  onToggle={() => toggleLevel(level.id)}
                />
              ))}
              
              {/* Boss challenge */}
              {unit.bossChallenge && (
                <div className="mt-4 p-4 rounded-xl border-2 border-dashed bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                  style={{ borderColor: '#f59e0b50' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👑</span>
                    <div>
                      <div className="text-amber-400 font-bold text-sm uppercase tracking-wider">Unit Boss Challenge</div>
                      <p className="text-white mt-1">{unit.bossChallenge}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer CTA */}
      <div className="flex flex-col items-center mt-16 animate-fade-up gap-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">Ready to begin your learning journey?</p>
          <p className="text-emerald-400 font-mono text-xs">Click "Save Path to My Account" above to start tracking progress</p>
        </div>
      </div>
    </div>
  );
};

// Legacy preview for old path format
const LegacyLearningTree: React.FC<{ path: PathStage[] }> = ({ path }) => {
  return (
    <div className="relative py-12 px-4">
      {/* Background Circuit Lines (Decorative) */}
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
          Initialize Path
        </div>
      </div>

      {/* Stages */}
      <div className="max-w-5xl mx-auto">
        {path.map((stage, index) => (
          <StageNode
            key={index}
            stage={stage}
            index={index}
            isLast={index === path.length - 1}
          />
        ))}
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

// Combined preview component that handles both formats
const LearningTreePreview: React.FC<{ path: PathStage[] | LearningPath }> = ({ path }) => {
  // Check if it's the new format
  if ('units' in path && Array.isArray(path.units)) {
    return <LearningPathPreview path={path as LearningPath} />;
  }
  // Otherwise use legacy format
  return <LegacyLearningTree path={path as PathStage[]} />;
};


export default function App() {
  const [state, setState] = useState<AppState>({
    mode: ViewMode.HOME,
    topic: '',
    isLoading: false,
    quickResources: [],
    learningPath: [],
    error: null,
  });

  const [filterType, setFilterType] = useState<string>('All');
  const [sortType, setSortType] = useState<string>('Relevance');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Quick Dive search limit tracking
  const [quickDiveSearches, setQuickDiveSearches] = useState<number>(() => {
    const stored = localStorage.getItem('attentio_quick_searches');
    return stored ? parseInt(stored, 10) : 0;
  });
  const QUICK_DIVE_LIMIT = 3;

  // Signup gate state
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [gateReason, setGateReason] = useState<'path' | 'quick_limit'>('path');

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Achievements state
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{ title: string; icon: string } | null>(null);

  // Saved path state
  const [currentSavedPath, setCurrentSavedPath] = useState<PathWithProgress | null>(null);
  const [savingPath, setSavingPath] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pathSaved, setPathSaved] = useState(false);

  // Skill level selection for learning paths
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<SkillLevel>('beginner');
  const [showSkillSelector, setShowSkillSelector] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Open signup gate with reason
  const openSignupGate = (reason: 'path' | 'quick_limit') => {
    setGateReason(reason);
    setShowSignupGate(true);
  };

  // Track Quick Dive searches
  const incrementQuickSearches = () => {
    const newCount = quickDiveSearches + 1;
    setQuickDiveSearches(newCount);
    localStorage.setItem('attentio_quick_searches', newCount.toString());
    return newCount;
  };

  // Check if user can use Quick Dive
  const canUseQuickDive = () => {
    return isAuthenticated || quickDiveSearches < QUICK_DIVE_LIMIT;
  };

  // Helper to check if learning path has content
  const hasLearningPathContent = (lp: PathStage[] | LearningPath): boolean => {
    if (Array.isArray(lp)) return lp.length > 0;
    return 'units' in lp && lp.units?.length > 0;
  };

  // Handle saving a learning path
  const handleSavePath = async (replace: boolean = false) => {
    if (!isAuthenticated || !hasLearningPathContent(state.learningPath)) return;

    setSavingPath(true);
    setSaveError(null);

    try {
      const result = await saveLearningPath(state.topic, state.learningPath, replace);
      setPathSaved(true);
      // Navigate to the saved path
      handleContinuePath(result.pathId);
    } catch (err: any) {
      // If path already exists, ask if they want to replace
      if (err.existingPathId) {
        const shouldReplace = confirm(
          `You already have a learning path for "${state.topic}". Would you like to replace it with this new one? Your existing progress will be lost.`
        );
        if (shouldReplace) {
          handleSavePath(true); // Retry with replace = true
        } else {
          setSaveError(null);
        }
      } else {
        setSaveError(err.message);
      }
    } finally {
      setSavingPath(false);
    }
  };

  // Handle continuing a saved path
  const handleContinuePath = async (pathId: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const pathData = await getPathWithProgress(pathId);
      setCurrentSavedPath(pathData);
      setState(prev => ({
        ...prev,
        mode: ViewMode.SAVED_PATH,
        topic: pathData.topic,
        isLoading: false
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  // Handle recreating a path with fresh content
  const handleRecreatePath = async (topic: string, existingPathId: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, mode: ViewMode.PATH, topic }));

    try {
      // Generate new learning path
      const path = await fetchLearningPath(topic);
      setState(prev => ({ ...prev, learningPath: path, isLoading: false }));

      // Auto-save with replace
      setSavingPath(true);
      const result = await saveLearningPath(topic, path, true);
      setPathSaved(true);
      handleContinuePath(result.pathId);
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    } finally {
      setSavingPath(false);
    }
  };

  // Handle progress updates
  const handleProgressUpdate = (completedTopics: number, completedStages: number) => {
    if (currentSavedPath) {
      setCurrentSavedPath(prev => prev ? {
        ...prev,
        completedTopics,
        completedStages
      } : null);
    }
  };

  // Debounce effect for fetching suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only fetch if input is substantial and user is not already loading a main search
      if (state.topic.trim().length > 2 && !state.isLoading && state.mode !== ViewMode.HOME) {
        try {
          const newSuggestions = await fetchSearchSuggestions(state.topic);
          setSuggestions(newSuggestions);
        } catch (err) {
          // Silent fail for suggestions
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [state.topic, state.mode, state.isLoading]);


  const handleModeSelect = (mode: ViewMode) => {
    // Gate Learning Path mode - require authentication
    if (mode === ViewMode.PATH && !isAuthenticated) {
      openSignupGate('path');
      return;
    }

    setState(prev => ({ ...prev, mode, error: null, topic: '', quickResources: [], learningPath: [] }));
    setFilterType('All');
    setSortType('Relevance');
    setSuggestions([]);
    setCurrentSavedPath(null);
    setPathSaved(false);
    setSaveError(null);
  };

  const executeSearch = useCallback(async (searchTopic: string, skillLevel?: SkillLevel) => {
    if (!searchTopic.trim()) return;

    // Check Quick Dive limit for non-authenticated users
    if (state.mode === ViewMode.QUICK && !isAuthenticated) {
      if (quickDiveSearches >= QUICK_DIVE_LIMIT) {
        openSignupGate('quick_limit');
        return;
      }
    }

    setState(prev => ({ ...prev, topic: searchTopic, isLoading: true, error: null, quickResources: [], learningPath: [] }));
    setSuggestions([]); // Clear suggestions on search
    setShowSkillSelector(false); // Hide skill selector

    try {
      if (state.mode === ViewMode.QUICK) {
        // Increment search count for non-authenticated users
        if (!isAuthenticated) {
          incrementQuickSearches();
        }
        const data = await fetchQuickResources(searchTopic);
        setState(prev => ({ ...prev, quickResources: data, isLoading: false }));
      } else if (state.mode === ViewMode.PATH) {
        const data = await fetchLearningPath(searchTopic, skillLevel || selectedSkillLevel);
        setState(prev => ({ ...prev, learningPath: data, isLoading: false }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: "System unable to retrieve data. Retry sequence initiated." }));
    }
  }, [state.mode, isAuthenticated, quickDiveSearches, selectedSkillLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.mode === ViewMode.PATH && state.topic.trim()) {
      // Show skill selector for learning paths
      setShowSkillSelector(true);
    } else {
      executeSearch(state.topic);
    }
  };

  const handleSkillLevelSelect = (level: SkillLevel) => {
    setSelectedSkillLevel(level);
    executeSearch(state.topic, level);
  };

  // Filtering and Sorting Logic
  const processedResources = useMemo(() => {
    let result = [...state.quickResources];
    if (filterType !== 'All') {
      result = result.filter(r => r.type === filterType);
    }
    if (sortType === 'Views') {
      result.sort((a, b) => b.viewCount - a.viewCount);
    } else if (sortType === 'Date') {
      result.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
    } else if (sortType === 'Duration (Shortest)') {
      result.sort((a, b) => a.durationMin - b.durationMin);
    } else if (sortType === 'Duration (Longest)') {
      result.sort((a, b) => b.durationMin - a.durationMin);
    }
    return result;
  }, [state.quickResources, filterType, sortType]);

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="mt-8 font-mono text-emerald-500 text-sm animate-pulse tracking-[0.3em]">PROCESSING DATA STREAM...</div>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="text-center py-20">
          <p className="text-red-400 bg-red-950/30 px-6 py-4 rounded-sm border border-red-900 inline-block font-mono text-sm">
            <span className="font-bold mr-2">[ERROR]</span>
            {state.error}
          </p>
        </div>
      );
    }

    if (state.mode === ViewMode.QUICK && state.quickResources.length > 0) {
      return (
        <div className="animate-fade-up">
          <div className="sticky top-20 z-40 bg-focus-base/90 backdrop-blur-xl border-y border-white/5 py-4 mb-10 -mx-6 px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar w-full md:w-auto">
              {['All', 'Video', 'Article', 'Course'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-6 py-2 rounded-sm text-xs font-bold font-mono uppercase tracking-wider transition-all border
                    ${filterType === type
                      ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : 'bg-transparent border-white/10 text-gray-500 hover:border-emerald-500/50 hover:text-emerald-400'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="relative">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="bg-focus-dim border border-white/10 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider rounded-sm px-4 py-2 pr-8 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none"
              >
                <option>Relevance</option>
                <option>Views</option>
                <option>Date</option>
                <option>Duration (Shortest)</option>
                <option>Duration (Longest)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-emerald-500"></div>
              </div>
            </div>
          </div>

          {processedResources.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-mono">NO RESOURCES MATCH FILTERS</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedResources.map((res, idx) => (
                <ResourceCard key={idx} resource={res} index={idx} />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Check if we have a learning path (handles both old array format and new object format)
    const hasLearningPath = Array.isArray(state.learningPath) 
      ? state.learningPath.length > 0 
      : 'units' in state.learningPath && state.learningPath.units?.length > 0;
    
    if (state.mode === ViewMode.PATH && hasLearningPath) {
      return (
        <div>
          {/* Save Path Action Bar */}
          {isAuthenticated && !pathSaved && (
            <div className="mb-8 flex items-center justify-center gap-4 animate-fade-up">
              <button
                onClick={() => handleSavePath(false)}
                disabled={savingPath}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-bold rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wider text-sm"
              >
                {savingPath ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Path to My Account
                  </>
                )}
              </button>
              {saveError && (
                <span className="text-red-400 text-sm font-mono">{saveError}</span>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <div className="mb-8 flex items-center justify-center animate-fade-up">
              <button
                onClick={() => openAuthModal('register')}
                className="px-6 py-3 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-400 font-bold rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider text-sm"
              >
                <UserIcon className="w-5 h-5" />
                Sign in to Save & Track Progress
              </button>
            </div>
          )}
          <LearningTreePreview path={state.learningPath} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-focus-base z-0"></div>
      <div className="perspective-grid"></div>
      <div className="scanline"></div>

      {/* Glow Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-focus-base/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center cursor-pointer group" onClick={() => handleModeSelect(ViewMode.HOME)}>
            <div className="w-10 h-10 rounded-sm bg-emerald-500 text-black flex items-center justify-center mr-4 shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:scale-105 transition-transform duration-300">
              <ZapIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter text-white leading-none">ATTENTIO</span>
              <span className="text-[10px] tracking-[0.3em] text-emerald-500 font-mono">FOCUS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {state.mode !== ViewMode.HOME && (
              <button onClick={() => handleModeSelect(ViewMode.HOME)} className="px-4 py-2 rounded-sm border border-emerald-500/30 text-xs font-mono text-emerald-500 hover:bg-emerald-500/10 transition-all uppercase tracking-widest">
                [ Abort ]
              </button>
            )}

            {/* Stats page link */}
            {state.mode !== ViewMode.STATS && (
              <button
                onClick={() => handleModeSelect(ViewMode.STATS)}
                className="px-4 py-2 rounded-sm text-xs font-mono text-gray-400 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Stats
              </button>
            )}

            {/* My Paths button for logged-in users */}
            {isAuthenticated && state.mode !== ViewMode.MY_PATHS && (
              <button
                onClick={() => handleModeSelect(ViewMode.MY_PATHS)}
                className="px-4 py-2 rounded-sm border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:bg-emerald-500/10 transition-all uppercase tracking-widest flex items-center gap-2"
              >
                <MapIcon className="w-4 h-4" />
                My Paths
              </button>
            )}

            {/* Auth section */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            ) : isAuthenticated ? (
              <UserMenu onOpenAchievements={() => setAchievementsModalOpen(true)} />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-sm text-xs font-mono text-gray-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all uppercase tracking-widest flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {state.mode === ViewMode.STATS ? (
          <StatsPage />
        ) : state.mode === ViewMode.HOME ? (
          <div className="animate-fade-up">
            <div className="text-center max-w-5xl mx-auto mb-20 mt-12">
              <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
                <span className="text-xs font-mono text-emerald-400 tracking-[0.2em] uppercase">Focus Engine Activated</span>
              </div>

              <h1 className="text-7xl md:text-9xl font-bold mb-8 tracking-tighter leading-[0.85] text-white">
                ELIMINATE <br />
                <span className="animate-text-shine">NOISE.</span>
              </h1>

              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light mb-12">
                Direct path to information. Choose your topic below.
              </p>

              <div className="flex justify-center gap-2 mb-16">
                <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                <div className="w-24 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Quick Dive Card with search limit indicator */}
              <div className="relative">
                <ModeCard
                  title="Quick Dive"
                  desc="Rapid information acquisition. Curated videos and briefs."
                  icon={ZapIcon}
                  active={false}
                  onClick={() => handleModeSelect(ViewMode.QUICK)}
                />
                {!isAuthenticated && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="px-2 py-1 bg-focus-dim border border-emerald-500/30 rounded text-[10px] font-mono text-emerald-400">
                      {QUICK_DIVE_LIMIT - quickDiveSearches} / {QUICK_DIVE_LIMIT} free
                    </div>
                  </div>
                )}
              </div>

              {/* Learning Path Card with lock indicator */}
              <div className="relative">
                <ModeCard
                  title="Learning Path"
                  desc="Long-term structural knowledge acquisition."
                  icon={MapIcon}
                  active={false}
                  onClick={() => handleModeSelect(ViewMode.PATH)}
                />
                {!isAuthenticated && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="px-2 py-1 bg-focus-dim border border-amber-500/30 rounded text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Sign up required
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Continue Learning Section for logged-in users */}
            {isAuthenticated && (
              <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-emerald-500" />
                    Continue Learning
                  </h2>
                  <button
                    onClick={() => handleModeSelect(ViewMode.MY_PATHS)}
                    className="text-xs font-mono text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                  >
                    View All →
                  </button>
                </div>
                <div className="tech-border bg-focus-surface/50 rounded-lg">
                  <MyPaths
                    onContinuePath={handleContinuePath}
                    onCreatePath={() => handleModeSelect(ViewMode.PATH)}
                    onRecreatePath={handleRecreatePath}
                  />
                </div>
              </div>
            )}
          </div>
        ) : state.mode === ViewMode.MY_PATHS ? (
          <div className="max-w-5xl mx-auto animate-fade-up">
            <div className="mb-12 border-l-4 border-emerald-500 pl-6">
              <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight text-white uppercase">
                My Learning Paths
              </h2>
              <p className="text-lg text-emerald-500/60 font-mono tracking-wider">
                // SAVED CURRICULUM SEQUENCES
              </p>
            </div>
            <MyPaths
              onContinuePath={handleContinuePath}
              onCreatePath={() => handleModeSelect(ViewMode.PATH)}
              onRecreatePath={handleRecreatePath}
            />
          </div>
        ) : state.mode === ViewMode.SAVED_PATH && currentSavedPath ? (
          <div className="max-w-5xl mx-auto animate-fade-up">
            <div className="mb-8 border-l-4 border-emerald-500 pl-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white uppercase">
                  {currentSavedPath.topic}
                </h2>
                <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-mono font-bold border rounded-sm ${currentSavedPath.status === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                  }`}>
                  {currentSavedPath.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
                </span>
              </div>
              <p className="text-lg text-emerald-500/60 font-mono tracking-wider">
                // {currentSavedPath.completedTopics}/{currentSavedPath.totalTopics} TOPICS COMPLETED
              </p>
            </div>

            {/* Progress Overview */}
            <div className="mb-8 p-4 bg-focus-surface border border-emerald-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-gray-400">Overall Progress</span>
                <span className="text-sm font-mono text-emerald-400">
                  {Math.round((currentSavedPath.completedTopics / currentSavedPath.totalTopics) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-emerald-500/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${(currentSavedPath.completedTopics / currentSavedPath.totalTopics) * 100}%` }}
                />
              </div>
            </div>

            <ProgressLearningTree
              pathId={currentSavedPath.id}
              path={currentSavedPath.pathData}
              progressMap={currentSavedPath.progressMap}
              onProgressUpdate={handleProgressUpdate}
              onNewAchievement={(achievement) => setAchievementToast({ title: achievement.title, icon: achievement.icon })}
            />

            {/* Certificate of Completion */}
            {currentSavedPath.completedTopics >= currentSavedPath.totalTopics && currentSavedPath.totalTopics > 0 && (
              <Certificate
                userName={user?.username || 'Learner'}
                topic={currentSavedPath.topic}
                completedDate={currentSavedPath.completedAt || new Date().toISOString()}
                totalStages={currentSavedPath.totalStages}
                totalTopics={currentSavedPath.totalTopics}
              />
            )}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 border-l-4 border-emerald-500 pl-6">
              <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight text-white uppercase">
                {state.mode === ViewMode.QUICK ? "Target Acquisition" : "Path Construction"}
              </h2>
              <p className="text-lg text-emerald-500/60 font-mono tracking-wider">
                {state.mode === ViewMode.QUICK ? "// DEPLOYING SEARCH DRONES" : "// BUILDING CURRICULUM NODES"}
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-emerald-500/20 rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative flex items-center bg-focus-surface border border-emerald-500/30 rounded-lg overflow-hidden group-hover:border-emerald-500/60 transition-colors">
                  <div className="pl-6 text-emerald-500">
                    <span className="font-mono text-xl">{'>'}</span>
                  </div>
                  <input
                    type="text"
                    value={state.topic}
                    onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Enter command / subject..."
                    className="w-full bg-transparent text-white px-4 py-6 text-xl font-mono focus:outline-none placeholder:text-gray-700 uppercase"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!state.topic.trim() || state.isLoading}
                    className="mr-2 p-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.isLoading ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ArrowRightIcon className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Search limit indicator for Quick Dive */}
              {state.mode === ViewMode.QUICK && !isAuthenticated && (
                <div className="mt-3 flex justify-center">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-gray-500">Free searches remaining:</span>
                    <div className="flex gap-1">
                      {[...Array(QUICK_DIVE_LIMIT)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${i < (QUICK_DIVE_LIMIT - quickDiveSearches)
                            ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                            : 'bg-gray-700'
                            }`}
                        />
                      ))}
                    </div>
                    {quickDiveSearches >= QUICK_DIVE_LIMIT && (
                      <button
                        type="button"
                        onClick={() => openAuthModal('register')}
                        className="text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Get unlimited
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Skill Level Selector for Learning Paths */}
            {showSkillSelector && state.mode === ViewMode.PATH && (
              <div className="mb-12 animate-fade-up">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Choose Your Target Skill Level</h3>
                  <p className="text-gray-400">
                    Learning <span className="text-emerald-400 font-semibold capitalize">{state.topic}</span> — How deep do you want to go?
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
                  {SKILL_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleSkillLevelSelect(level.id)}
                      className={`group relative p-5 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                        selectedSkillLevel === level.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-focus-surface hover:border-emerald-500/50'
                      }`}
                    >
                      {/* Icon */}
                      <div className="text-4xl mb-3">{level.icon}</div>
                      
                      {/* Title */}
                      <h4 className="text-lg font-bold text-white mb-1">{level.label}</h4>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{level.description}</p>
                      
                      {/* Stats */}
                      <div className="text-[10px] font-mono text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Units:</span>
                          <span className="text-emerald-400">{level.units.min}-{level.units.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Time:</span>
                          <span className="text-amber-400">{level.estimatedHours.min}-{level.estimatedHours.max}h</span>
                        </div>
                      </div>
                      
                      {/* Selected indicator */}
                      {selectedSkillLevel === level.id && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowSkillSelector(false)}
                    className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    ← Change topic
                  </button>
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            {suggestions.length > 0 && !showSkillSelector && (
              <div className="mb-16 animate-fade-up">
                <div className="text-[10px] text-emerald-500/60 font-mono tracking-[0.2em] mb-3 uppercase">
                  Trending Vectors:
                </div>
                <div className="flex flex-wrap gap-3">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (state.mode === ViewMode.PATH) {
                          // For learning paths, set topic and show skill selector
                          setState(prev => ({ ...prev, topic: suggestion }));
                          setShowSkillSelector(true);
                        } else {
                          executeSearch(suggestion);
                        }
                      }}
                      className="px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 text-sm font-mono transition-all duration-300 flex items-center group"
                    >
                      <span className="mr-2 opacity-50 group-hover:opacity-100">+</span>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {renderContent()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 border-t border-white/5 bg-focus-base/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Product Hunt Badge */}
            <div className="flex items-center">
              <a
                href="https://www.producthunt.com/products/attentio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-attentio"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1043400&theme=dark&t=1764311424044"
                  alt="Attentio - In a world full of distractions, learning smarter is key. | Product Hunt"
                  style={{ width: '250px', height: '54px' }}
                  width="250"
                  height="54"
                />
              </a>
            </div>

            {/* Creator Credit */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400 font-mono">
                Created by <span className="text-emerald-400 font-semibold">Zachariah Mithani</span>
              </p>
              <p className="text-xs text-gray-600 font-mono mt-1">
                © {new Date().getFullYear()} Attentio. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Achievements Modal */}
      {achievementsModalOpen && (
        <AchievementsModal onClose={() => setAchievementsModalOpen(false)} />
      )}

      {/* Achievement Toast */}
      {achievementToast && (
        <AchievementToast
          achievement={achievementToast}
          onClose={() => setAchievementToast(null)}
        />
      )}

      {/* Signup Gate Modal */}
      {showSignupGate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSignupGate(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md mx-4 animate-fade-up">
            <div className="relative tech-border bg-focus-surface rounded-xl p-8">
              {/* Close button */}
              <button
                onClick={() => setShowSignupGate(false)}
                className="absolute top-4 right-4 z-20 text-gray-500 hover:text-white transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  {gateReason === 'path' ? (
                    <MapIcon className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <ZapIcon className="w-8 h-8 text-emerald-400" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white text-center mb-2 uppercase tracking-tight">
                {gateReason === 'path' ? 'Unlock Learning Paths' : 'Free Searches Used'}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-center mb-6 leading-relaxed">
                {gateReason === 'path' ? (
                  <>
                    Learning Paths are an exclusive feature for registered users.
                    Create a free account to build personalized curriculum sequences and track your progress.
                  </>
                ) : (
                  <>
                    You've used all {QUICK_DIVE_LIMIT} free Quick Dive searches.
                    Create a free account for unlimited searches and access to Learning Paths.
                  </>
                )}
              </p>

              {/* Benefits */}
              <div className="bg-focus-dim rounded-lg p-4 mb-6">
                <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest mb-3">
                  Free Account Benefits
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3" />
                    Unlimited Quick Dive searches
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3" />
                    Full Learning Path generation
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3" />
                    Save & track progress on paths
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3" />
                    Earn achievements & certificates
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSignupGate(false);
                    openAuthModal('register');
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors uppercase tracking-wider text-sm"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => {
                    setShowSignupGate(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-3 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 font-bold rounded-lg transition-colors uppercase tracking-wider text-sm"
                >
                  Already have an account? Sign In
                </button>
              </div>

              {/* Search count indicator for quick dive limit */}
              {gateReason === 'quick_limit' && (
                <div className="mt-4 text-center">
                  <span className="text-xs text-gray-500 font-mono">
                    {quickDiveSearches}/{QUICK_DIVE_LIMIT} searches used
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}