import React, { useState, useEffect, useRef } from 'react';
import { ZapIcon, MapIcon } from './Icons';

interface PublicStats {
  users: number;
  quickDiveSearches: number;
  pathsGenerated: number;
  pathsStarted: number;
  pathsCompleted: number;
  achievements: number;
}

// Animated rolling counter component
const RollingCounter: React.FC<{
  value: number;
  duration?: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}> = ({ value, duration = 2000, label, icon, color, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start animation after delay
    const startTimer = setTimeout(() => {
      setHasStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted || value === 0) return;

    const startTime = Date.now();
    const startValue = 0;

    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (value - startValue) * easeOutQuart);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, duration, hasStarted]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <div 
      ref={counterRef}
      className="group relative tech-border bg-focus-surface rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300"
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${color}`} />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color.replace('bg-', 'bg-').replace('/20', '/10')} border border-opacity-30 ${color.replace('bg-', 'border-').replace('/20', '/30')}`}>
          {icon}
        </div>

        {/* Counter */}
        <div className="mb-2">
          <span className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tight">
            {formatNumber(displayValue)}
          </span>
        </div>

        {/* Label */}
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
          {label}
        </p>

        {/* Animated underline */}
        <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${color.replace('/20', '')}`}
            style={{ 
              width: hasStarted ? '100%' : '0%',
              transitionDelay: `${delay}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/stats/public`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Stats fetch error:', err);
        setError('Unable to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="mt-8 font-mono text-emerald-500 text-sm animate-pulse tracking-[0.3em]">LOADING METRICS...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 bg-red-950/30 px-6 py-4 rounded-sm border border-red-900 inline-block font-mono text-sm">
          <span className="font-bold mr-2">[ERROR]</span>
          {error || 'Unable to load statistics'}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
          <span className="text-xs font-mono text-emerald-400 tracking-[0.2em] uppercase">Live Platform Metrics</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter text-white">
          COMMUNITY <span className="text-emerald-400">STATS</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Real-time metrics from the Attentio learning community. Watch the numbers grow as more learners join.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Users */}
        <RollingCounter
          value={stats.users}
          label="Registered Users"
          icon={
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="bg-blue-500/20"
          delay={0}
        />

        {/* Quick Dive Searches */}
        <RollingCounter
          value={stats.quickDiveSearches}
          label="Quick Dive Searches"
          icon={<ZapIcon className="w-6 h-6 text-yellow-400" />}
          color="bg-yellow-500/20"
          delay={100}
        />

        {/* Paths Generated */}
        <RollingCounter
          value={stats.pathsGenerated}
          label="Learning Paths Created"
          icon={<MapIcon className="w-6 h-6 text-purple-400" />}
          color="bg-purple-500/20"
          delay={200}
        />

        {/* Paths Started */}
        <RollingCounter
          value={stats.pathsStarted}
          label="Paths Started"
          icon={
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-emerald-500/20"
          delay={300}
        />

        {/* Paths Completed */}
        <RollingCounter
          value={stats.pathsCompleted}
          label="Paths Completed"
          icon={
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-green-500/20"
          delay={400}
        />

        {/* Achievements */}
        <RollingCounter
          value={stats.achievements}
          label="Achievements Earned"
          icon={
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
          color="bg-amber-500/20"
          delay={500}
        />
      </div>

      {/* Live indicator */}
      <div className="mt-12 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-focus-dim rounded-full border border-emerald-500/20">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Stats update in real-time
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

