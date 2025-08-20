// LearningProgressSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, BookOpen, CheckCircle } from 'lucide-react';
import { MOTION_TRANSITION } from '@/constants/motion';
import { PersistentUserState } from './UserStateManager';

interface Module {
  moduleId: number;
  title: string;
}

interface LearningState {
  completedModules: number[];
  overallProgress: number;
}

interface LearningProgressSectionProps {
  allLearningCompleted: boolean;
  learningState: LearningState;
  modules: Module[];
  persistentUserState: PersistentUserState | null;
}

const LearningProgressSection: React.FC<LearningProgressSectionProps> = ({
  allLearningCompleted,
  learningState,
  modules,
  persistentUserState,
}) => {
  if (allLearningCompleted) return null;

  return (
    <motion.div
      className="border-primary/30 mt-6 rounded-2xl border-2 bg-slate-800/60 p-6 backdrop-blur-sm"
      transition={MOTION_TRANSITION}
      initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="flex items-start gap-4">
        <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full">
          <Lock className="text-primary" size={24} />
        </div>
        <div className="flex-1">
          <h4 className="text-primary mb-2 font-bold">Final Assessment Locked</h4>
          <p className="mb-4 text-gray-300">
            Complete all learning modules to unlock the comprehensive final quiz and earn your NFT
            certificate.
          </p>

          {/* Enhanced user-specific progress indication with persistent state */}
          <div className="mb-4 rounded-lg bg-slate-700/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-300">Your Progress</span>
              {persistentUserState && (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-400">{persistentUserState.userName}</span>
                </div>
              )}
            </div>
            <div className="text-white">
              {learningState.completedModules.length} of {modules.length} modules completed
            </div>
            {persistentUserState && (
              <div className="mt-1 text-xs text-slate-400">
                Session: {persistentUserState.userId.slice(-8)} • Active since{' '}
                {new Date(persistentUserState.lastSeen).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm text-gray-400">
              <span>Learning Progress</span>
              <span>
                {learningState.completedModules.length} of {modules.length} modules
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="from-primary to-primary/80 h-full bg-gradient-to-r transition-all duration-300"
                style={{ width: `${learningState.overallProgress}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p className="mb-2 flex items-center gap-2">
              <BookOpen size={14} className="text-primary" />
              Module Completion Checklist
              {persistentUserState && ` for ${persistentUserState.userName}`}:
            </p>
            <ul className="ml-6 space-y-1">
              {modules.map((module) => (
                <li key={module.moduleId} className="flex items-center gap-2">
                  {learningState.completedModules.includes(module.moduleId) ? (
                    <CheckCircle size={14} className="text-green-400" />
                  ) : (
                    <div className="border-primary/50 h-3.5 w-3.5 rounded-full border-2" />
                  )}
                  <span
                    className={
                      learningState.completedModules.includes(module.moduleId)
                        ? 'text-green-300 line-through'
                        : 'text-gray-300'
                    }
                  >
                    {module.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LearningProgressSection;
