// CourseSidebar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, Star, Brain, Loader, Timer, User } from 'lucide-react';
import { MOTION_TRANSITION } from '@/constants/motion';
import { PersistentUserState } from './UserStateManager';

interface Module {
  moduleId: number;
  title: string;
  content: string;
  codeExample?: string;
}

interface LearningState {
  currentModuleIndex: number;
  completedModules: number[];
  overallProgress: number;
  statistics?: {
    totalTimeSpent: number;
    bookmarkCount: number;
    noteCount: number;
    completionRate: number;
  };
}

interface CourseSidebarProps {
  modules: Module[];
  learningState: LearningState;
  allLearningCompleted: boolean;
  isLoadingQuiz: boolean;
  persistentUserState: PersistentUserState | null;
  onModuleClick: (index: number) => void;
  onStartQuiz: () => void;
}

const truncateTitle = (title: string, maxLength: number = 30) => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  modules,
  learningState,
  allLearningCompleted,
  isLoadingQuiz,
  persistentUserState,
  onModuleClick,
  onStartQuiz,
}) => {
  const isModuleUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevModule = modules[index - 1];
    return prevModule && learningState.completedModules.includes(prevModule.moduleId);
  };

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-36">
        <motion.div
          transition={MOTION_TRANSITION}
          initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
            <BookOpen className="h-5 w-5 text-blue-400" />
            Course Modules
          </h3>

          {/* Enhanced User Progress Summary with Persistent State */}
          <div className="mb-4 rounded-lg bg-slate-800/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Your Progress</span>
              {persistentUserState && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-400">{persistentUserState.userName}</span>
                </div>
              )}
            </div>
            <div className="text-sm text-white">
              {learningState.completedModules.length} of {modules.length} modules
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${learningState.overallProgress}%` }}
              />
            </div>
            {persistentUserState && (
              <div className="mt-2 text-xs text-slate-400">
                User ID: {persistentUserState.userId.slice(-8)}
              </div>
            )}
          </div>

          {/* Module List */}
          <div className="space-y-3">
            {modules.map((module, index) => {
              const moduleId = Number(module.moduleId);
              const isUnlocked = isModuleUnlocked(index);
              const isCompleted = learningState.completedModules.includes(moduleId);
              const isCurrent = learningState.currentModuleIndex === index;

              return (
                <button
                  key={moduleId}
                  onClick={() => onModuleClick(index)}
                  disabled={!isUnlocked}
                  className={`w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] ${
                    isCurrent && isUnlocked
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400/50'
                      : isCompleted
                        ? 'bg-slate-800/60 text-green-100 shadow-md backdrop-blur-sm hover:bg-slate-800/80 hover:shadow-lg'
                        : isUnlocked
                          ? 'bg-slate-800/60 text-gray-200 shadow-md backdrop-blur-sm hover:bg-slate-800/80 hover:shadow-lg'
                          : 'cursor-not-allowed bg-slate-800/40 text-gray-500 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Simplified Status Icon - no quiz logic */}
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent && isUnlocked
                            ? 'border-white bg-white/20 text-white'
                            : isUnlocked
                              ? 'border-gray-400 text-gray-400'
                              : 'border-gray-500 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={12} />
                      ) : !isUnlocked ? (
                        <Lock size={10} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Simplified Content - no quiz status */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-tight font-semibold" title={module.title}>
                        {truncateTitle(module.title, 30)}
                      </div>
                      <div
                        className={`mt-1 text-xs ${
                          isCurrent && isUnlocked
                            ? 'text-blue-100'
                            : isCompleted
                              ? 'text-green-300'
                              : isUnlocked
                                ? 'text-gray-400'
                                : 'text-gray-500'
                        }`}
                      >
                        Module {index + 1}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quiz Button in Sidebar */}
          <div className="mt-6 border-t border-slate-600/50 pt-4">
            {allLearningCompleted ? (
              <button
                onClick={onStartQuiz}
                disabled={isLoadingQuiz}
                className="from-primary to-primary/80 hover:from-primary/90 hover:to-primary w-full rounded-lg bg-gradient-to-r px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50"
              >
                {isLoadingQuiz ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading Quiz...
                  </div>
                ) : (
                  '🚀 Start Final Quiz'
                )}
              </button>
            ) : (
              <div className="w-full rounded-lg bg-slate-700/50 px-4 py-3 text-center text-sm font-medium text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <Lock size={14} />
                  Quiz Locked
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Learning Statistics */}
          {learningState.statistics && (
            <div className="mt-4 rounded-lg bg-slate-800/40 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-300">Your Learning Stats</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Time:</span>
                  <span className="text-white">
                    {Math.floor(learningState.statistics.totalTimeSpent / 60)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bookmarks:</span>
                  <span className="text-white">{learningState.statistics.bookmarkCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notes:</span>
                  <span className="text-white">{learningState.statistics.noteCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completion:</span>
                  <span className="text-white">
                    {Math.round(learningState.statistics.completionRate)}%
                  </span>
                </div>
                {persistentUserState && (
                  <div className="mt-2 flex justify-between border-t border-slate-600/50 pt-2">
                    <span className="text-slate-400">Student:</span>
                    <span className="text-green-400">{persistentUserState.userName}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-400">Session:</span>
                  <span className="text-blue-400">
                    Active • {persistentUserState?.userId.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CourseSidebar;
