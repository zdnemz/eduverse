// components/course/CourseDetailView.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthUser } from '@/stores/auth-store';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import type {
  CourseInfo,
  CourseContent as DIDCourseContent,
  Module as DIDModule,
  Lesson as DIDLesson,
} from 'declarations/eduverse_backend/eduverse_backend.did';
import { MOTION_TRANSITION } from '@/constants/motion';
import {
  Play,
  Book,
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  Lock,
  ArrowLeft,
  Download,
  NotebookPen,
} from 'lucide-react';

import CourseDetailHeader from './CourseDetailHeader';

interface CourseDetailViewProps {
  courseId: number;
  onBack: () => void;
}

export default function CourseDetailView({ courseId, onBack }: CourseDetailViewProps) {
  const user = useAuthUser();
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [courseContent, setCourseContent] = useState<DIDCourseContent | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;

    const initActor = async () => {
      try {
        const client = await getAuthClient();
        if (await client.isAuthenticated()) {
          const identity = client.getIdentity();
          const newActor = await createActor(identity);
          setActor(newActor);
        }
      } catch (error) {
        console.error('Failed to initialize actor:', error);
        toast.error('Failed to initialize connection');
        setError('Failed to initialize connection');
      }
    };

    initActor();
  }, [user]);

  useEffect(() => {
    if (!actor || !courseId) return;

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const coursesResult = await actor.getCourses();
        if (coursesResult && coursesResult.length > 0) {
          const course = coursesResult.find((c: CourseInfo) => Number(c.id) === courseId);
          if (course) {
            setCourseInfo(course);
          } else {
            throw new Error('Course not found');
          }
        } else {
          throw new Error('No courses available');
        }

        // Fetch course content
        const contentResult = await actor.getCourseContent(BigInt(courseId));
        if (contentResult && contentResult.length > 0 && contentResult[0]) {
          setCourseContent(contentResult[0]);

          if (contentResult[0].modules && contentResult[0].modules.length > 0) {
            const firstModule = contentResult[0].modules[0];
            if (firstModule && firstModule.id) {
              setSelectedModuleId(Number(firstModule.id));

              if (firstModule.lessons && firstModule.lessons.length > 0) {
                const firstLesson = firstModule.lessons[0];
                if (firstLesson && firstLesson.id) {
                  setSelectedLessonId(Number(firstLesson.id));
                }
              }
            }
          }
        } else {
          const mockContent: DIDCourseContent = {
            courseId: BigInt(courseId),
            modules: [
              {
                id: BigInt(1),
                title: 'Introduction',
                description: 'Getting started with the basics',
                estimatedTime: '2 hours',
                prerequisites: [],
                isLocked: false,
                lessons: [
                  {
                    id: BigInt(1),
                    title: 'Welcome to the Course',
                    content: {
                      summary: 'Introduction to the course content and objectives',
                      keyPoints: ['Course overview', 'Learning objectives', 'Prerequisites'],
                      detailedContent: 'Welcome to this comprehensive course...',
                      codeExamples: [],
                    },
                    videoUrl: [],
                    duration: '15 minutes',
                    lessonType: { Video: null },
                    resources: [],
                    isCompleted: false,
                  },
                ],
                quiz: [],
              },
            ],
          };
          setCourseContent(mockContent);
          setSelectedModuleId(1);
          setSelectedLessonId(1);
        }
      } catch (error) {
        console.error('Failed to fetch course data:', error);
        setError('Failed to load course data');
        toast.error('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [actor, courseId]);

  const selectedModule = courseContent?.modules.find(
    (module) => Number(module.id) === selectedModuleId
  );

  const selectedLesson = selectedModule?.lessons.find(
    (lesson) => Number(lesson.id) === selectedLessonId
  );

  const getCodeExample = (codeExamples: [] | [string] | undefined): string | null => {
    if (!codeExamples || codeExamples.length === 0) return null;
    return codeExamples[0];
  };

  const handleMarkComplete = (lessonId: number) => {
    setCompletedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
    toast.success('Lesson status updated!');
  };

  const isLessonLocked = (lesson: any, module: any) => {
    const lessonIndex = module.lessons.findIndex((l: any) => Number(l.id) === Number(lesson.id));
    if (lessonIndex === 0) return false;

    const previousLesson = module.lessons[lessonIndex - 1];
    return !completedLessons.includes(Number(previousLesson.id));
  };

  // Convert DID CourseContent to local CourseContent format for CourseDetailHeader
  const convertCourseContentForHeader = (didContent: DIDCourseContent) => {
    return {
      ...didContent,
      modules: didContent.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          content: {
            ...lesson.content,
            codeExamples:
              lesson.content.codeExamples && lesson.content.codeExamples.length > 0
                ? lesson.content.codeExamples[0]
                : undefined,
          },
        })),
      })),
    };
  };

  if (loading) {
    return (
      <motion.div
        className="min-h-screen space-y-6 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={MOTION_TRANSITION}
      >
        {/* Enhanced Loading skeleton */}
        <div className="from-primary/10 to-secondary/10 animate-pulse rounded-3xl bg-gradient-to-br p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="bg-base-300/50 h-64 w-full rounded-2xl lg:w-80"></div>
            <div className="flex-1 space-y-6">
              <div className="bg-base-300/50 h-10 w-3/4 rounded-lg"></div>
              <div className="bg-base-300/50 h-6 w-1/2 rounded-lg"></div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-base-300/50 h-24 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <div className="xl:col-span-1">
            <div className="card bg-base-100/70 animate-pulse border-0 shadow-lg backdrop-blur-sm">
              <div className="card-body space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-base-300/50 h-4 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="xl:col-span-3">
            <div className="card bg-base-100/70 animate-pulse border-0 shadow-lg backdrop-blur-sm">
              <div className="card-body space-y-4">
                <div className="bg-base-300/50 h-8 w-1/2 rounded-lg"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-base-300/50 h-4 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !courseInfo) {
    return (
      <motion.div
        className="flex min-h-screen items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={MOTION_TRANSITION}
      >
        <div className="card bg-base-100 max-w-md shadow-xl">
          <div className="card-body text-center">
            <div className="text-error mx-auto mb-4 text-6xl">⚠️</div>
            <h2 className="card-title justify-center">Oops! Something went wrong</h2>
            <p className="text-base-content/70">{error || 'Course not found'}</p>
            <div className="card-actions mt-4 justify-center">
              <button onClick={onBack} className="btn btn-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="from-base-200 to-base-300 min-h-screen bg-gradient-to-br">
      <motion.div
        className="space-y-8 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={MOTION_TRANSITION}
      >
        {/* Course Header - Removed background wrapper */}
        {courseContent && (
          <CourseDetailHeader
            courseInfo={courseInfo}
            courseContent={convertCourseContentForHeader(courseContent)}
            onBack={onBack}
          />
        )}

        {/* Enhanced Course Content */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-4">
          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1">
            <motion.div
              className="card bg-base-100/80 border-0 shadow-xl backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="card-body p-6">
                <h3 className="card-title mb-6 flex items-center gap-2 text-xl">
                  <BookOpen className="text-primary h-5 w-5" />
                  Course Modules
                </h3>

                <div className="space-y-3">
                  {courseContent?.modules.map((module, index) => {
                    const completedLessonsInModule = module.lessons.filter((lesson) =>
                      completedLessons.includes(Number(lesson.id))
                    ).length;
                    const totalLessons = module.lessons.length;
                    const progress =
                      totalLessons > 0 ? (completedLessonsInModule / totalLessons) * 100 : 0;

                    return (
                      <motion.div
                        key={module.id.toString()}
                        className={`group cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                          Number(module.id) === selectedModuleId
                            ? 'border-primary bg-primary/5 shadow-lg'
                            : 'border-base-300 hover:border-primary/50 hover:bg-base-50'
                        }`}
                        onClick={() => {
                          setSelectedModuleId(Number(module.id));
                          if (module.lessons.length > 0) {
                            setSelectedLessonId(Number(module.lessons[0].id));
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <h4 className="text-base-content group-hover:text-primary font-semibold transition-colors">
                              {module.title}
                            </h4>
                            <div className="badge badge-primary badge-sm">{index + 1}</div>
                          </div>

                          <p className="text-base-content/70 mb-3 text-sm leading-relaxed">
                            {module.description}
                          </p>

                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-base-content/60">Progress</span>
                              <span className="text-base-content/50">
                                {completedLessonsInModule}/{totalLessons}
                              </span>
                            </div>
                            <div className="bg-base-300 h-2 w-full rounded-full">
                              <motion.div
                                className="from-primary to-secondary h-2 rounded-full bg-gradient-to-r"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>

                          <div className="text-base-content/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{module.estimatedTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Book className="h-3 w-3" />
                              <span>{module.lessons.length} lessons</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Enhanced Lessons List */}
            {selectedModule && (
              <motion.div
                className="card bg-base-100/80 mt-6 border-0 shadow-xl backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="card-body p-6">
                  <h4 className="mb-4 flex items-center gap-2 font-semibold">
                    <Play className="text-secondary h-4 w-4" />
                    Lessons
                  </h4>

                  <div className="space-y-2">
                    {selectedModule.lessons.map((lesson, index) => {
                      const isCompleted = completedLessons.includes(Number(lesson.id));
                      const isLocked = isLessonLocked(lesson, selectedModule);
                      const isSelected = Number(lesson.id) === selectedLessonId;

                      return (
                        <motion.button
                          key={lesson.id.toString()}
                          className={`group w-full rounded-lg p-3 text-left transition-all duration-200 ${
                            isSelected
                              ? 'bg-secondary text-secondary-content shadow-lg'
                              : isLocked
                                ? 'bg-base-200 text-base-content/40 cursor-not-allowed'
                                : isCompleted
                                  ? 'hover:bg-success/10 bg-success/5 text-success border-success/20 border'
                                  : 'hover:bg-base-200 hover:border-base-300 border border-transparent'
                          }`}
                          onClick={() => !isLocked && setSelectedLessonId(Number(lesson.id))}
                          disabled={isLocked}
                          whileHover={!isLocked ? { x: 4 } : {}}
                          whileTap={!isLocked ? { scale: 0.98 } : {}}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {isLocked ? (
                                <Lock className="h-4 w-4" />
                              ) : isCompleted ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{lesson.title}</div>
                              <div className="text-xs opacity-70">{lesson.duration}</div>
                            </div>

                            {isSelected && (
                              <div className="flex-shrink-0">
                                <div className="h-2 w-2 rounded-full bg-current"></div>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Main Content */}
          <div className="xl:col-span-3">
            <motion.div
              className="card bg-base-100/80 border-0 shadow-xl backdrop-blur-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="card-body p-8">
                {selectedLesson ? (
                  <motion.div
                    key={selectedLesson.id.toString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOTION_TRANSITION}
                    className="space-y-8"
                  >
                    {/* Enhanced Lesson Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="mb-2 text-3xl leading-tight font-bold">
                          {selectedLesson.title}
                        </h1>
                        <div className="text-base-content/70 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{selectedLesson.duration}</span>
                          </div>
                          <div className="badge badge-primary gap-1">
                            {'Video' in selectedLesson.lessonType ? (
                              <>
                                <Play className="h-3 w-3" />
                                Video
                              </>
                            ) : 'Reading' in selectedLesson.lessonType ? (
                              <>
                                <Book className="h-3 w-3" />
                                Reading
                              </>
                            ) : (
                              <>
                                <Book className="h-3 w-3" />
                                Code Lab
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Video Section */}
                    <div className="overflow-hidden rounded-2xl shadow-2xl">
                      {selectedLesson.videoUrl && selectedLesson.videoUrl.length > 0 ? (
                        <div className="aspect-video w-full bg-black">
                          <video
                            className="h-full w-full object-cover"
                            controls
                            poster="/api/placeholder/800/450"
                          >
                            <source src={selectedLesson.videoUrl[0]} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="from-base-300 to-base-200 flex aspect-video w-full items-center justify-center bg-gradient-to-br">
                          <div className="text-center">
                            <Play className="text-base-content/30 mx-auto mb-4 h-16 w-16" />
                            <div className="text-base-content/60 mb-2 text-lg font-medium">
                              Video content coming soon
                            </div>
                            <div className="text-base-content/40 text-sm">
                              This lesson will include video content
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Content Sections */}
                    <div className="space-y-8">
                      {/* Summary */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                          <Book className="text-primary h-5 w-5" />
                          Summary
                        </h3>
                        <div className="bg-primary/5 border-primary/20 rounded-xl border p-6">
                          <p className="text-base-content/80 leading-relaxed">
                            {selectedLesson.content.summary}
                          </p>
                        </div>
                      </motion.div>

                      {/* Key Points */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                          <CheckCircle className="text-secondary h-5 w-5" />
                          Key Points
                        </h3>
                        <div className="space-y-3">
                          {selectedLesson.content.keyPoints.map((point, index) => (
                            <motion.div
                              key={index}
                              className="bg-secondary/5 border-secondary/20 flex items-start gap-4 rounded-xl border p-4"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="bg-secondary text-secondary-content mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className="text-base-content/80 leading-relaxed">{point}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Detailed Content */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                          <BookOpen className="text-accent h-5 w-5" />
                          Detailed Content
                        </h3>
                        <div className="bg-accent/5 border-accent/20 rounded-xl border p-6">
                          <div className="prose prose-lg max-w-none">
                            <p className="text-base-content/80 leading-relaxed">
                              {selectedLesson.content.detailedContent}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Code Examples */}
                      {(() => {
                        const codeExample = getCodeExample(selectedLesson.content.codeExamples);
                        return codeExample ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                              <Book className="text-info h-5 w-5" />
                              Code Examples
                            </h3>
                            <div className="mockup-code shadow-xl">
                              <pre>
                                <code>{codeExample}</code>
                              </pre>
                            </div>
                          </motion.div>
                        ) : null;
                      })()}
                    </div>

                    {/* Enhanced Action Buttons */}
                    <motion.div
                      className="bg-base-100/90 sticky bottom-0 flex flex-col gap-3 rounded-xl p-6 shadow-lg backdrop-blur-sm sm:flex-row"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <button
                        className={`btn flex-1 shadow-lg ${
                          completedLessons.includes(Number(selectedLesson.id))
                            ? 'btn-success gap-2'
                            : 'btn-primary gap-2'
                        }`}
                        onClick={() => handleMarkComplete(Number(selectedLesson.id))}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {completedLessons.includes(Number(selectedLesson.id))
                          ? 'Completed ✓'
                          : 'Mark as Complete'}
                      </button>
                      <button className="btn btn-outline flex-1 gap-2 shadow-lg">
                        <NotebookPen className="h-4 w-4" />
                        Take Notes
                      </button>
                      <button className="btn btn-outline flex-1 gap-2 shadow-lg">
                        <Download className="h-4 w-4" />
                        Resources
                      </button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="text-base-content/20 mx-auto mb-4 h-20 w-20" />
                      <div className="text-base-content/50 mb-3 text-2xl font-medium">
                        Select a lesson to start
                      </div>
                      <div className="text-base-content/30 text-base">
                        Choose a module and lesson from the sidebar to begin learning
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
