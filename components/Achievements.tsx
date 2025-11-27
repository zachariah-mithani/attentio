import React, { useState, useEffect } from 'react';
import { Achievement, getUserAchievements, getAchievementIcon } from '../services/achievementService';

interface AchievementsProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsProps> = ({ onClose }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const data = await getUserAchievements();
        setAchievements(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadAchievements();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-fade-up">
        <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-lg" />
        
        <div className="relative bg-focus-base border border-emerald-500/30 rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 py-6 border-b border-emerald-500/20 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                Achievements
              </h2>
              <p className="text-sm text-emerald-500/60 font-mono mt-1">
                // YOUR EARNED BADGES
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-500/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                <div className="mt-4 font-mono text-emerald-500 text-sm animate-pulse">LOADING...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 font-mono text-sm">[ERROR] {error}</p>
              </div>
            ) : achievements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">No Achievements Yet</h3>
                <p className="text-gray-500 font-mono text-sm">
                  Complete learning paths to earn achievements!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, idx) => (
                  <div
                    key={achievement.id}
                    className="group relative bg-focus-surface border border-emerald-500/20 rounded-lg p-5 hover:border-emerald-500/50 transition-all animate-fade-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Glow on hover */}
                    <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 rounded-lg transition-colors" />
                    
                    <div className="relative z-10 flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl shrink-0">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-wider">
                            {formatDate(achievement.earned_at)}
                          </span>
                          {achievement.topic && (
                            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider px-2 py-0.5 bg-gray-800 rounded">
                              {achievement.topic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer stats */}
          {achievements.length > 0 && (
            <div className="px-6 py-4 border-t border-emerald-500/20 bg-focus-surface/50">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 font-mono">{achievements.length}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {achievements.filter(a => a.type === 'path_completion').length}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Paths</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {achievements.filter(a => a.type.startsWith('milestone') || a.type === 'first_path').length}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Milestones</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Small badge to show in user menu
export const AchievementBadge: React.FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => {
  if (count === 0) return null;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-colors"
    >
      <span className="text-lg">🏆</span>
      <span className="text-sm font-mono text-emerald-400">{count}</span>
    </button>
  );
};

// Achievement toast notification
export const AchievementToast: React.FC<{ achievement: { title: string; icon: string }; onClose: () => void }> = ({ 
  achievement, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-fade-up">
      <div className="relative">
        <div className="absolute -inset-1 bg-emerald-500/30 rounded-xl blur-lg animate-pulse" />
        <div className="relative bg-focus-base border border-emerald-500/50 rounded-xl p-4 flex items-center gap-4 shadow-2xl">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-2xl">
            {getAchievementIcon(achievement.icon)}
          </div>
          <div>
            <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1">
              Achievement Unlocked!
            </div>
            <div className="text-white font-bold">{achievement.title}</div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

