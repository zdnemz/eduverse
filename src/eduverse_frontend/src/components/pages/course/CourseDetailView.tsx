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
          // Langsung gunakan type dari DID, tidak perlu casting
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
          // If no content available, create mock content that matches DID types
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
                      codeExamples: [], // Sesuai dengan DID type: [] | [string]
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

  // Helper function untuk handle codeExamples yang bertipe [] | [string]
  const getCodeExample = (codeExamples: [] | [string] | undefined): string | null => {
    if (!codeExamples || codeExamples.length === 0) return null;
    return codeExamples[0];
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
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={MOTION_TRANSITION}
      >
        {/* Loading skeleton for header */}
        <div className="from-primary/20 to-secondary/20 animate-pulse rounded-2xl bg-gradient-to-r p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="bg-base-300 h-48 w-full rounded-lg lg:w-64"></div>
            <div className="flex-1 space-y-4">
              <div className="bg-base-300 h-8 w-3/4 rounded"></div>
              <div className="bg-base-300 h-6 w-1/2 rounded"></div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-base-300 h-20 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading skeleton for content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="card border-base-300 bg-base-200 animate-pulse border">
              <div className="card-body space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-base-300 h-4 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="card border-base-300 bg-base-200 animate-pulse border">
              <div className="card-body space-y-4">
                <div className="bg-base-300 h-6 w-1/2 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-base-300 h-4 rounded"></div>
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
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={MOTION_TRANSITION}
      >
        <div className="alert alert-error">
          <span>{error || 'Course not found'}</span>
        </div>
        <button onClick={onBack} className="btn btn-primary">
          Back to Courses
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={MOTION_TRANSITION}
    >
      {/* Course Header */}
      {courseContent && (
        <CourseDetailHeader
          courseInfo={courseInfo}
          courseContent={convertCourseContentForHeader(courseContent)}
          onBack={onBack}
        />
      )}

      {/* Course Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar - Module List */}
        <div className="lg:col-span-1">
          <div className="card border-base-300 bg-base-200 border shadow">
            <div className="card-body p-4">
              <h3 className="card-title text-lg">Course Modules</h3>
              <div className="space-y-2">
                {courseContent?.modules.map((module) => (
                  <motion.button
                    key={module.id.toString()}
                    className={`btn w-full justify-start text-left ${
                      Number(module.id) === selectedModuleId
                        ? 'btn-primary'
                        : 'btn-ghost btn-outline'
                    }`}
                    onClick={() => {
                      setSelectedModuleId(Number(module.id));
                      if (module.lessons.length > 0) {
                        setSelectedLessonId(Number(module.lessons[0].id));
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-left">
                      <div className="font-medium">{module.title}</div>
                      <div className="text-xs opacity-70">{module.estimatedTime}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Lessons in Selected Module */}
          {selectedModule && (
            <div className="card border-base-300 bg-base-200 mt-4 border shadow">
              <div className="card-body p-4">
                <h4 className="font-semibold">Lessons</h4>
                <div className="space-y-1">
                  {selectedModule.lessons.map((lesson) => (
                    <button
                      key={lesson.id.toString()}
                      className={`btn btn-sm w-full justify-start text-left ${
                        Number(lesson.id) === selectedLessonId ? 'btn-secondary' : 'btn-ghost'
                      }`}
                      onClick={() => setSelectedLessonId(Number(lesson.id))}
                    >
                      <div>
                        <div className="text-sm font-medium">{lesson.title}</div>
                        <div className="text-xs opacity-60">{lesson.duration}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Lesson Details */}
        <div className="lg:col-span-3">
          <div className="card border-base-300 bg-base-200 border shadow">
            <div className="card-body">
              {selectedLesson ? (
                <motion.div
                  key={selectedLesson.id.toString()}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={MOTION_TRANSITION}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="card-title text-2xl">{selectedLesson.title}</h2>
                      <p className="text-base-content/70">{selectedLesson.duration}</p>
                    </div>
                    <div className="badge badge-primary">
                      {'Video' in selectedLesson.lessonType
                        ? 'Video'
                        : 'Reading' in selectedLesson.lessonType
                          ? 'Reading'
                          : 'Code Lab'}
                    </div>
                  </div>

                  {/* Lesson Video/Content */}
                  <div className="mb-6">
                    {selectedLesson.videoUrl && selectedLesson.videoUrl.length > 0 ? (
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
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
                      <div className="bg-base-300 flex aspect-video w-full items-center justify-center rounded-lg">
                        <div className="text-center">
                          <div className="text-base-content/50 mb-2">Video content coming soon</div>
                          <div className="text-base-content/30 text-sm">
                            This lesson will include video content
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lesson Summary */}
                  <div className="mb-6">
                    <h3 className="mb-3 text-lg font-semibold">Summary</h3>
                    <div className="bg-base-300/50 rounded-lg p-4">
                      <p className="text-base-content/80">{selectedLesson.content.summary}</p>
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="mb-6">
                    <h3 className="mb-3 text-lg font-semibold">Key Points</h3>
                    <div className="space-y-2">
                      {selectedLesson.content.keyPoints.map((point, index) => (
                        <motion.div
                          key={index}
                          className="bg-base-300/30 flex items-start gap-3 rounded-lg p-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="bg-primary text-primary-content mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-base-content/80">{point}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Content */}
                  <div className="mb-6">
                    <h3 className="mb-3 text-lg font-semibold">Detailed Content</h3>
                    <div className="bg-base-300/30 rounded-lg p-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-base-content/80 leading-relaxed">
                          {selectedLesson.content.detailedContent}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Code Examples (if available) - Updated untuk handle DID type */}
                  {(() => {
                    const codeExample = getCodeExample(selectedLesson.content.codeExamples);
                    return codeExample ? (
                      <div className="mb-6">
                        <h3 className="mb-3 text-lg font-semibold">Code Examples</h3>
                        <div className="mockup-code">
                          <pre>
                            <code>{codeExample}</code>
                          </pre>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Lesson Actions */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      className={`btn flex-1 ${
                        selectedLesson.isCompleted ? 'btn-success' : 'btn-primary'
                      }`}
                      onClick={() => {
                        // Mark lesson as completed
                        toast.success('Lesson marked as completed!');
                      }}
                    >
                      {selectedLesson.isCompleted ? 'Completed ✓' : 'Mark as Complete'}
                    </button>
                    <button className="btn btn-outline flex-1">Take Notes</button>
                    <button className="btn btn-outline flex-1">Download Resources</button>
                  </div>
                </motion.div>
              ) : (
                <div className="py-12 text-center">
                  <div className="text-base-content/50 mb-3 text-xl">Select a lesson to start</div>
                  <div className="text-base-content/30 text-sm">
                    Choose a module and lesson from the sidebar to begin learning
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
