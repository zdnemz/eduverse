// ModuleHeader.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Timer, User, CheckCircle, Star, FileText } from 'lucide-react';
import { MOTION_TRANSITION } from '@/constants/motion';
import { PersistentUserState } from './UserStateManager';

interface Module {
  moduleId: number;
  title: string;
}

interface LearningState {
  currentModuleIndex: number;
  completedModules: number[];
  readingProgress: number;
  timeSpent: number;
  bookmarkedModules: number[];
  moduleNotes: { [moduleId: number]: string };
}

interface LearningActions {
  toggleBookmark: (moduleId: number) => void;
  saveNote: (note: string, moduleId: number) => void;
  completeCurrentModule: () => void;
}

interface ModuleHeaderProps {
  module: Module;
  learningState: LearningState;
  sessionTimeSpent: number;
  persistentUserState: PersistentUserState | null;
  learningActions: LearningActions;
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  module,
  learningState,
  sessionTimeSpent,
  persistentUserState,
  learningActions,
}) => {
  return (
    <motion.div
      className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow backdrop-blur-sm"
      transition={MOTION_TRANSITION}
      initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          Module {learningState.currentModuleIndex + 1}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            ~15 min read
          </div>
          {learningState.timeSpent > 0 && (
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              {Math.floor(learningState.timeSpent / 60)}m spent
            </div>
          )}
          {/* User Session Time */}
          {sessionTimeSpent > 0 && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {Math.floor(sessionTimeSpent / 60)}m session
            </div>
          )}
        </div>
      </div>
      <h2 className="mb-6 text-3xl leading-tight font-bold text-white" title={module.title}>
        {module.title}
      </h2>

      {/* Module Status and Actions - USER-SPECIFIC WITH PERSISTENT STATE */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {learningState.completedModules.includes(module.moduleId) ? (
            <div className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
              <CheckCircle size={16} />
              Completed by You
            </div>
          ) : (
            <div className="bg-primary rounded-full px-3 py-1 text-sm font-medium text-white shadow-lg">
              In Progress
            </div>
          )}

          {/* Reading Progress */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-slate-600">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-300"
                style={{ width: `${learningState.readingProgress}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">
              {Math.round(learningState.readingProgress)}%
            </span>
          </div>
        </div>

        {/* Module Actions - USER-SPECIFIC WITH PERSISTENT USER INDICATOR */}
        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={() => learningActions.toggleBookmark(module.moduleId)}
            className={`rounded-lg p-2 text-sm transition-colors ${
              learningState.bookmarkedModules.includes(module.moduleId)
                ? 'bg-yellow-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
            title={
              learningState.bookmarkedModules.includes(module.moduleId)
                ? 'Remove bookmark'
                : 'Bookmark this module'
            }
          >
            <Star size={16} />
          </button>

          {/* Notes Button */}
          <button
            onClick={() => {
              const currentNote = learningState.moduleNotes[module.moduleId] || '';
              const note = prompt('Add a note for this module:', currentNote);
              if (note !== null) {
                learningActions.saveNote(note, module.moduleId);
              }
            }}
            className={`rounded-lg p-2 text-sm transition-colors ${
              learningState.moduleNotes[module.moduleId]
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
            title={learningState.moduleNotes[module.moduleId] ? 'Edit your note' : 'Add a note'}
          >
            <FileText size={16} />
          </button>

          {/* Persistent User Indicator */}
          {persistentUserState && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/20 px-2 py-1">
              <span className="text-xs text-green-400">{persistentUserState.userName}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ModuleHeader;
