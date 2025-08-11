// components/course/CourseSidebar.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Book,
  Award,
  Lock,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface CourseSidebarProps {
  modules: any[];
  selectedModuleId: number | null;
  onModuleSelect: (moduleId: number) => void;
  selectedLesson: any;
  onLessonSelect: (lesson: any) => void;
  completedLessons: number[];
  showQuiz: boolean;
  onShowQuiz: (moduleId: number) => void;
  quizResults: any;
  onShowCertificate: () => void;
}

export default function CourseSidebar({
  modules,
  selectedModuleId,
  onModuleSelect,
  selectedLesson,
  onLessonSelect,
  completedLessons,
  showQuiz,
  onShowQuiz,
  quizResults,
  onShowCertificate,
}: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const calculateModuleProgress = (module: any) => {
    const completed = module.lessons.filter((lesson: any) =>
      completedLessons.includes(lesson.id)
    ).length;
    const total = module.lessons.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const isLessonLocked = (lesson: any, module: any) => {
    const lessonIndex = module.lessons.findIndex((l: any) => l.id === lesson.id);
    if (lessonIndex === 0) return false;

    const previousLesson = module.lessons[lessonIndex - 1];
    return !completedLessons.includes(previousLesson.id);
  };

  const isQuizUnlocked = (module: any) => {
    const progress = calculateModuleProgress(module);
    return progress.percentage === 100;
  };

  return (
    <div className="card bg-base-200 sticky top-4 shadow-md">
      <div className="card-body p-4">
        <h2 className="card-title mb-4 text-lg">Course Content</h2>

        <div className="space-y-3">
          {modules.map((module) => {
            const progress = calculateModuleProgress(module);
            const isExpanded = expandedModules.includes(module.id);
            const isSelected = selectedModuleId === module.id;
            const quizUnlocked = isQuizUnlocked(module);

            return (
              <motion.div
                key={module.id}
                className={`overflow-hidden rounded-lg border transition-all ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-base-300'
                }`}
                layout
              >
                {/* Module Header */}
                <div
                  className="hover:bg-base-300/50 cursor-pointer p-3 transition-colors"
                  onClick={() => {
                    onModuleSelect(module.id);
                    toggleModule(module.id);
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base-content text-sm font-semibold">{module.title}</h3>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="text-base-content/60 h-4 w-4" />
                    </motion.div>
                  </div>

                  <p className="text-base-content/70 mb-2 text-xs">{module.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-base-content/60 text-xs">Progress</span>
                      <span className="text-base-content/50 text-xs">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                    <div className="bg-base-300 h-1.5 w-full rounded-full">
                      <motion.div
                        className="from-primary to-secondary h-1.5 rounded-full bg-gradient-to-r"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="text-base-content/60 flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{module.estimatedTime}</span>
                  </div>
                </div>

                {/* Module Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-base-300 border-t"
                    >
                      <div className="space-y-1 p-2">
                        {/* Lessons */}
                        {module.lessons.map((lesson: any) => {
                          const isLocked = isLessonLocked(lesson, module);
                          const isCompleted = completedLessons.includes(lesson.id);
                          const isLessonSelected = selectedLesson?.id === lesson.id;

                          return (
                            <motion.button
                              key={lesson.id}
                              className={`w-full rounded p-2 text-left text-xs transition-colors ${
                                isLessonSelected
                                  ? 'bg-primary text-primary-content'
                                  : isLocked
                                    ? 'bg-base-300/50 text-base-content/40 cursor-not-allowed'
                                    : isCompleted
                                      ? 'hover:bg-success/20 text-success'
                                      : 'hover:bg-base-300/70'
                              }`}
                              onClick={() => !isLocked && onLessonSelect(lesson)}
                              disabled={isLocked}
                              whileHover={!isLocked ? { scale: 1.02 } : {}}
                              whileTap={!isLocked ? { scale: 0.98 } : {}}
                            >
                              <div className="flex items-center gap-2">
                                {isLocked ? (
                                  <Lock className="h-3 w-3" />
                                ) : lesson.lessonType === 'Video' ? (
                                  <Play className="h-3 w-3" />
                                ) : (
                                  <Book className="h-3 w-3" />
                                )}

                                <span className="flex-1 truncate">{lesson.title}</span>

                                {isCompleted && <CheckCircle className="text-success h-3 w-3" />}
                              </div>
                            </motion.button>
                          );
                        })}

                        {/* Quiz Section */}
                        <div className="border-base-300/50 mt-2 border-t pt-2">
                          <motion.button
                            className={`w-full rounded p-2 text-left text-xs transition-colors ${
                              !quizUnlocked
                                ? 'bg-base-300/50 text-base-content/40 cursor-not-allowed'
                                : showQuiz
                                  ? 'bg-secondary text-secondary-content'
                                  : quizResults?.passed
                                    ? 'bg-success/20 text-success hover:bg-success/30'
                                    : 'hover:bg-secondary/20'
                            }`}
                            onClick={() => quizUnlocked && onShowQuiz(module.id)}
                            disabled={!quizUnlocked}
                            whileHover={quizUnlocked ? { scale: 1.02 } : {}}
                            whileTap={quizUnlocked ? { scale: 0.98 } : {}}
                          >
                            <div className="flex items-center gap-2">
                              {!quizUnlocked ? (
                                <Lock className="h-3 w-3" />
                              ) : quizResults?.passed ? (
                                <Award className="h-3 w-3" />
                              ) : (
                                <Award className="h-3 w-3" />
                              )}

                              <span className="flex-1">
                                {!quizUnlocked
                                  ? `Quiz Locked (${progress.total - progress.completed} lessons left)`
                                  : quizResults?.passed
                                    ? `Quiz Passed (${quizResults.percentage.toFixed(0)}%)`
                                    : `Take Quiz (${module.quiz?.length || 0} questions)`}
                              </span>
                            </div>
                          </motion.button>

                          {/* Certificate Button */}
                          {quizResults?.passed && (
                            <motion.button
                              className="bg-warning text-warning-content hover:bg-warning/80 mt-1 w-full rounded p-2 text-xs transition-colors"
                              onClick={onShowCertificate}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Award className="h-3 w-3" />
                                <span>Get Certificate</span>
                              </div>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
