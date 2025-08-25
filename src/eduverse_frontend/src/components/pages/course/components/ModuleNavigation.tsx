// ModuleNavigation.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock, Award } from 'lucide-react';
import { toast } from 'sonner';
import { MOTION_TRANSITION } from '@/constants/motion';
import { PersistentUserState } from './UserStateManager';

interface LearningState {
  currentModuleIndex: number;
  completedModules: number[];
}

interface LearningActions {
  goToPreviousModule: () => void;
  goToNextModule: () => void;
}

interface Module {
  moduleId: number;
}

interface ModuleNavigationProps {
  learningState: LearningState;
  totalModules: number;
  currentModule: Module | null;
  persistentUserState: PersistentUserState | null;
  learningActions: LearningActions;
  isModuleLocked: (moduleIndex: number) => boolean;
}

const ModuleNavigation: React.FC<ModuleNavigationProps> = ({
  learningState,
  totalModules,
  currentModule,
  persistentUserState,
  learningActions,
  isModuleLocked,
}) => {
  const handleReadyForQuiz = () => {
    toast.success('All learning modules completed! Take the final quiz to earn your certificate.');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <motion.div
      className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm"
      transition={MOTION_TRANSITION}
      initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div>
        {learningState.currentModuleIndex > 0 ? (
          <button
            onClick={() => learningActions.goToPreviousModule()}
            className="flex items-center gap-2 font-medium text-gray-300 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Module
          </button>
        ) : (
          <div></div>
        )}
      </div>

      <span className="text-center text-gray-400">
        <div className="flex items-center gap-2">
          Module {learningState.currentModuleIndex + 1} of {totalModules}
          {persistentUserState && (
            <span className="text-xs text-green-400">({persistentUserState.userName})</span>
          )}
        </div>
        {learningState.currentModuleIndex < totalModules - 1 &&
          currentModule &&
          !learningState.completedModules.includes(currentModule.moduleId) && (
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-orange-400">
              <Lock size={12} />
              Complete this module to unlock next
            </div>
          )}
      </span>

      <div className="flex items-center gap-4">
        {learningState.currentModuleIndex < totalModules - 1 && (
          <button
            onClick={() => learningActions.goToNextModule()}
            disabled={isModuleLocked(learningState.currentModuleIndex + 1)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium transition-all duration-200 ${
              isModuleLocked(learningState.currentModuleIndex + 1)
                ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg'
            }`}
          >
            {isModuleLocked(learningState.currentModuleIndex + 1) ? (
              <>
                <Lock size={16} />
                Locked
              </>
            ) : (
              <>
                Next Module
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}

        {learningState.currentModuleIndex === totalModules - 1 &&
          currentModule &&
          learningState.completedModules.includes(currentModule.moduleId) && (
            <button
              onClick={handleReadyForQuiz}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg"
            >
              <Award className="h-4 w-4" />
              Ready for Quiz
            </button>
          )}
      </div>
    </motion.div>
  );
};

export default ModuleNavigation;
