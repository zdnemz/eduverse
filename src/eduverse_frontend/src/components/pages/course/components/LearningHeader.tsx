// LearningHeader.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersistentUserState } from './UserStateManager';

interface CourseInfo {
  title: string;
  instructor: string;
}

interface LearningState {
  currentModuleIndex: number;
  overallProgress: number;
  readingProgress: number;
}

interface LearningHeaderProps {
  scrolled: boolean;
  courseInfo: CourseInfo;
  persistentUserState: PersistentUserState | null;
  learningState: LearningState;
  totalModules: number;
}

const truncateTitle = (title: string, maxLength: number = 50) => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

const LearningHeader: React.FC<LearningHeaderProps> = ({
  scrolled,
  courseInfo,
  persistentUserState,
  learningState,
  totalModules,
}) => {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-slate-700/30 bg-slate-900/95 shadow-2xl backdrop-blur-xl'
          : 'bg-transparent'
      )}
    >
      <div className="px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* LEFT: Back Button */}
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="group flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/60 px-4 py-2.5 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-slate-600/50 hover:bg-slate-700/80"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
          </div>

          {/* CENTER: Course Info */}
          <div className="max-w-2xl flex-1 px-8 text-center">
            <h1
              className="mb-1 truncate text-xl font-bold text-white md:text-2xl"
              title={courseInfo.title}
            >
              {truncateTitle(courseInfo.title, 50)}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <span>by</span>
                <span className="font-medium text-blue-400 capitalize">
                  {courseInfo.instructor}
                </span>
              </div>
              {persistentUserState && (
                <div className="flex items-center gap-2">
                  -
                  <span className="font-medium text-green-400 capitalize">
                    {persistentUserState.userName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Progress & Stats */}
          <div className="flex items-center gap-4">
            {/* Module Info */}
            <div className="hidden items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 backdrop-blur-sm sm:flex">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium whitespace-nowrap text-white">
                {learningState.currentModuleIndex + 1}/{totalModules}
              </span>
            </div>

            {/* Reading Progress Bar */}
            <div className="hidden flex-col items-center gap-1 md:flex">
              <div className="text-xs font-medium text-slate-400">Reading</div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 rounded-full bg-slate-700/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700 ease-out"
                    style={{ width: `${learningState.readingProgress}%` }}
                  />
                </div>
                <span className="min-w-[2.5rem] text-right text-xs font-bold text-green-400">
                  {Math.round(learningState.readingProgress)}%
                </span>
              </div>
            </div>

            {/* Overall Progress Circle */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs font-medium text-slate-400">Progress</div>
              <div className="relative">
                <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-slate-700/60"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500 transition-all duration-1000 ease-out"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={`${learningState.overallProgress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">
                    {Math.round(learningState.overallProgress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LearningHeader;
