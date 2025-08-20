// ModuleContent.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';
import { MOTION_TRANSITION } from '@/constants/motion';
import ContentRenderer from './ContentRenderer';
import CodeBlock from './CodeBlock';
import { PersistentUserState } from './UserStateManager';

interface Module {
  moduleId: number;
  title: string;
  content: string;
  codeExample?: string;
}

interface LearningState {
  completedModules: number[];
  readingProgress: number;
  moduleNotes: { [moduleId: number]: string };
}

interface LearningActions {
  completeCurrentModule: () => void;
}

interface ModuleContentProps {
  module: Module;
  learningState: LearningState;
  persistentUserState: PersistentUserState | null;
  learningActions: LearningActions;
  onReadingProgressUpdate: (progress: number) => void;
}

const ModuleContent: React.FC<ModuleContentProps> = ({
  module,
  learningState,
  persistentUserState,
  learningActions,
  onReadingProgressUpdate,
}) => {
  return (
    <>
      {/* Learning Material */}
      <motion.div
        className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow backdrop-blur-sm"
        transition={MOTION_TRANSITION}
        initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
          <FileText className="h-5 w-5 text-blue-400" />
          Learning Material
          {persistentUserState && (
            <span className="ml-auto text-sm font-normal text-slate-400">
              Student: {persistentUserState.userName}
            </span>
          )}
        </h3>

        <div className="rounded-lg border border-slate-600/50 bg-slate-900/50 p-6">
          <ContentRenderer content={module.content} onProgressUpdate={onReadingProgressUpdate} />

          {/* Show saved note if exists - USER-SPECIFIC WITH PERSISTENT STATE */}
          {learningState.moduleNotes[module.moduleId] && (
            <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-400">
                <FileText size={14} />
                Your Personal Note
                {persistentUserState && (
                  <span className="ml-auto text-xs text-blue-300">
                    by {persistentUserState.userName}
                  </span>
                )}
              </h4>
              <p className="text-sm text-blue-100">{learningState.moduleNotes[module.moduleId]}</p>
            </div>
          )}

          <div className="mt-6 border-t border-slate-600/50 pt-4">
            {!learningState.completedModules.includes(module.moduleId) ? (
              <button
                onClick={() => learningActions.completeCurrentModule()}
                disabled={learningState.readingProgress < 80}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {learningState.readingProgress < 80
                  ? `Read ${80 - Math.round(learningState.readingProgress)}% more to complete`
                  : 'Mark as Completed'}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={20} />
                <span className="font-medium">Module completed by you</span>
                {persistentUserState && (
                  <span className="ml-2 text-xs text-green-300">
                    ({persistentUserState.userName})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Code Example */}
      {module.codeExample && (
        <motion.div
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm"
          transition={MOTION_TRANSITION}
          initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <FileText className="h-5 w-5 text-blue-400" />
            Code Example
          </h3>
          <CodeBlock code={module.codeExample} />
        </motion.div>
      )}
    </>
  );
};

export default ModuleContent;