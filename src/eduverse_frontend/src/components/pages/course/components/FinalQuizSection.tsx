// FinalQuizSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Timer, Zap, Award, ChevronRight, Loader } from 'lucide-react';
import { MOTION_TRANSITION } from '@/constants/motion';
import { PersistentUserState } from './UserStateManager';

interface LearningState {
  statistics?: {
    totalTimeSpent: number;
    bookmarkCount: number;
    noteCount: number;
  };
}

interface CourseQuiz {
  questions: any[];
  passingScore: number;
  timeLimit: number;
}

interface FinalQuizSectionProps {
  allLearningCompleted: boolean;
  persistentUserState: PersistentUserState | null;
  learningState: LearningState;
  totalModules: number;
  finalQuizData: CourseQuiz | null;
  isLoadingQuiz: boolean;
  onStartQuiz: () => void;
}

const FinalQuizSection: React.FC<FinalQuizSectionProps> = ({
  allLearningCompleted,
  persistentUserState,
  learningState,
  totalModules,
  finalQuizData,
  isLoadingQuiz,
  onStartQuiz,
}) => {
  if (!allLearningCompleted) return null;

  return (
    <motion.div
      className="border-primary/30 from-primary/10 via-primary/5 relative mt-6 overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent shadow-2xl backdrop-blur-sm"
      transition={MOTION_TRANSITION}
      initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="bg-primary/30 absolute top-4 right-4 h-20 w-20 rounded-full blur-xl" />
        <div className="bg-primary/20 absolute bottom-4 left-4 h-16 w-16 rounded-full blur-lg" />
        <div className="bg-primary/10 absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" />
      </div>

      <div className="relative p-8">
        <div className="text-center">
          {/* Icon Container with Animation */}
          <div className="relative mx-auto mb-6">
            <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
            <div className="from-primary to-primary/80 relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-lg">
              <Brain className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Title with Gradient */}
          <h3 className="from-primary to-primary/70 mb-4 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
            Ready for Final Assessment!
          </h3>

          <p className="mb-8 text-lg leading-relaxed text-gray-300">
            Excellent work{persistentUserState && `, ${persistentUserState.userName}`}! You've
            mastered all learning modules.
            <br />
            <span className="font-semibold text-white">
              Take the comprehensive final quiz to earn your NFT certificate.
            </span>
          </p>

          {/* Enhanced User Achievement Summary with Persistent State */}
          <div className="mb-8 rounded-xl bg-slate-800/60 p-4">
            <h4 className="mb-3 font-bold text-white">Your Achievement Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{totalModules}</div>
                <div className="text-gray-400">Modules Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {Math.floor((learningState.statistics?.totalTimeSpent || 0) / 60)}
                </div>
                <div className="text-gray-400">Minutes Studied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {learningState.statistics?.bookmarkCount || 0}
                </div>
                <div className="text-gray-400">Bookmarks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {learningState.statistics?.noteCount || 0}
                </div>
                <div className="text-gray-400">Notes</div>
              </div>
            </div>
            {persistentUserState && (
              <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-600/50 pt-3">
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <span className="text-sm text-green-400">
                  Completed by {persistentUserState.userName} • Session Active
                </span>
              </div>
            )}
          </div>

          {/* Quiz Features Grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-center">
                <Target className="text-primary mr-2 h-6 w-6" />
                <h4 className="font-bold text-white">Smart Questions</h4>
              </div>
              <p className="text-sm text-gray-300">
                Carefully crafted questions covering all key concepts from your learning journey
              </p>
            </div>

            <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-center">
                <Timer className="text-primary mr-2 h-6 w-6" />
                <h4 className="font-bold text-white">Generous Time</h4>
              </div>
              <p className="text-sm text-gray-300">
                {finalQuizData?.timeLimit ? Math.floor(finalQuizData.timeLimit / 60) : 15} minutes
                to demonstrate your knowledge without pressure
              </p>
            </div>

            <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-center">
                <Zap className="text-primary mr-2 h-6 w-6" />
                <h4 className="font-bold text-white">Instant Feedback</h4>
              </div>
              <p className="text-sm text-gray-300">
                Get immediate explanations for each answer to reinforce your learning
              </p>
            </div>

            <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-center">
                <Award className="text-primary mr-2 h-6 w-6" />
                <h4 className="font-bold text-white">NFT Certificate</h4>
              </div>
              <p className="text-sm text-gray-300">
                Pass with {finalQuizData?.passingScore || 75}%+ to earn your blockchain-verified
                certificate
              </p>
            </div>
          </div>

          {/* Quiz Stats */}
          <div className="mb-8 flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {finalQuizData?.questions.length || totalModules}
              </div>
              <div className="text-gray-400">Questions</div>
            </div>
            <div className="h-8 w-px bg-gray-600" />
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {finalQuizData?.passingScore || 75}%
              </div>
              <div className="text-gray-400">To Pass</div>
            </div>
            <div className="h-8 w-px bg-gray-600" />
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {finalQuizData?.timeLimit ? Math.floor(finalQuizData.timeLimit / 60) : 15}
              </div>
              <div className="text-gray-400">Minutes</div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={onStartQuiz}
              disabled={isLoadingQuiz}
              className="group from-primary to-primary/80 relative overflow-hidden rounded-xl bg-gradient-to-r px-12 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* Button Background Animation */}
              <div className="from-primary/80 to-primary absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex items-center gap-3">
                {isLoadingQuiz ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Loading Quiz...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    Start Final Assessment
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </div>
            </button>
          </div>

          {/* User ID & Motivation Text with Persistent State */}
          <div className="mt-6 text-sm text-gray-400">
            <p className="mb-2">
              <span className="font-medium text-gray-300">Pro tip:</span> Review your learning
              materials before starting.
            </p>
            {persistentUserState && (
              <p className="text-xs text-green-400">
                You've got this, {persistentUserState.userName}! Show off everything you've learned.
                <br />
                <span className="text-slate-500">
                  Session ID: {persistentUserState.userId.slice(-8)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FinalQuizSection;
