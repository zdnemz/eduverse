// components/course/LessonContent.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Clock, ExternalLink, BookOpen, Code } from 'lucide-react';
import { toast } from 'sonner';

interface LessonContentProps {
  lesson: any;
  isCompleted: boolean;
  onComplete: (lessonId: number) => void;
}

export default function LessonContent({ lesson, isCompleted, onComplete }: LessonContentProps) {
  const [readingTime, setReadingTime] = useState(0);
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      setReadingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted]);

  const handleMarkComplete = () => {
    const minReadingTime = 30;
    const hasVideo = lesson.videoUrl && lesson.videoUrl.length > 0;

    if (readingTime >= minReadingTime && (!hasVideo || hasWatchedVideo)) {
      onComplete(lesson.id);
      toast.success('Lesson completed! 🎉');
    } else {
      if (readingTime < minReadingTime) {
        toast.warning('Please spend at least 30 seconds reading the content');
      } else if (hasVideo && !hasWatchedVideo) {
        toast.warning('Please watch the video to complete this lesson');
      }
    }
  };

  const canComplete = readingTime >= 30 && (!lesson.videoUrl || hasWatchedVideo);
  const hasVideo = lesson.videoUrl && lesson.videoUrl.length > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLessonTypeIcon = () => {
    switch (lesson.lessonType) {
      case 'Video':
        return <Play className="text-primary h-5 w-5" />;
      case 'CodeLab':
        return <Code className="text-secondary h-5 w-5" />;
      default:
        return <BookOpen className="text-info h-5 w-5" />;
    }
  };

  const getLessonTypeBadge = () => {
    switch (lesson.lessonType) {
      case 'Video':
        return 'badge-primary';
      case 'CodeLab':
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  };

  if (!lesson) return null;

  return (
    <motion.div
      className="card bg-base-200 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-body">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              {getLessonTypeIcon()}
              <h2 className="card-title text-base-content text-xl">{lesson.title}</h2>
              {isCompleted && (
                <motion.div
                  className="text-success flex items-center gap-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-semibold">Completed</span>
                </motion.div>
              )}
            </div>

            <p className="text-base-content/70 mb-3">{lesson.content.summary}</p>

            <div className="text-base-content/60 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{lesson.duration}</span>
              </div>
              <div className={`badge ${getLessonTypeBadge()} badge-sm`}>{lesson.lessonType}</div>
            </div>
          </div>
        </div>

        {/* Key Points */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-base-content mb-3 text-lg font-semibold">Key Learning Points:</h3>
          <div className="grid gap-2">
            {lesson.content.keyPoints.map((point: string, index: number) => (
              <motion.div
                key={index}
                className="bg-base-300/50 flex items-start gap-3 rounded-lg p-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                <span className="text-base-content/80">{point}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Content */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-base-content mb-3 text-lg font-semibold">Content:</h3>
          <div className="prose max-w-none">
            <div className="bg-base-100 border-base-300 rounded-lg border p-4">
              <p className="text-base-content/80 leading-relaxed">
                {showFullContent
                  ? lesson.content.detailedContent
                  : `${lesson.content.detailedContent.substring(0, 200)}...`}
              </p>
              {lesson.content.detailedContent.length > 200 && (
                <button
                  className="btn btn-link btn-sm mt-2 p-0"
                  onClick={() => setShowFullContent(!showFullContent)}
                >
                  {showFullContent ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Code Examples (if available) */}
        {lesson.content.codeExamples && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-base-content mb-3 text-lg font-semibold">Code Examples:</h3>
            <div className="mockup-code">
              <pre>
                <code>{lesson.content.codeExamples}</code>
              </pre>
            </div>
          </motion.div>
        )}

        {/* Video Section */}
        {hasVideo && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-base-content mb-3 text-lg font-semibold">Video Lesson:</h3>
            <div className="bg-base-100 border-base-300 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Play className="text-primary h-5 w-5" />
                  <div>
                    <p className="text-base-content font-medium">Watch Video</p>
                    <p className="text-base-content/60 text-sm">{lesson.duration}</p>
                  </div>
                </div>

                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm gap-2"
                  onClick={() => {
                    setHasWatchedVideo(true);
                    toast.success('Video opened! Mark as watched when finished.');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Watch Now
                </a>
              </div>

              {!hasWatchedVideo && !isCompleted && (
                <div className="bg-warning/10 border-warning/20 mt-3 rounded-lg border p-3">
                  <p className="text-warning flex items-center gap-2 text-sm">
                    <Play className="h-4 w-4" />
                    Please watch the video to complete this lesson
                  </p>
                </div>
              )}

              {hasWatchedVideo && (
                <div className="bg-success/10 border-success/20 mt-3 rounded-lg border p-3">
                  <p className="text-success flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Video watched! You can now complete the lesson.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Resources */}
        {lesson.resources && lesson.resources.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-base-content mb-3 text-lg font-semibold">Additional Resources:</h3>
            <div className="space-y-2">
              {lesson.resources.map((resource: string, index: number) => (
                <motion.a
                  key={index}
                  href={resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-base-100 border-base-300 hover:border-primary/50 group flex items-center gap-2 rounded-lg border p-3 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ExternalLink className="text-base-content/60 group-hover:text-primary h-4 w-4" />
                  <span className="text-base-content/80 group-hover:text-primary truncate text-sm">
                    {resource}
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completion Section */}
        <motion.div
          className="border-base-300 border-t pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-base-content/60 text-sm">
                Reading time: {formatTime(readingTime)}
              </div>
              {hasVideo && (
                <div className="text-base-content/60 text-sm">
                  Video: {hasWatchedVideo ? '✅ Watched' : '⏳ Not watched'}
                </div>
              )}
            </div>

            {!isCompleted && (
              <motion.button
                className={`btn ${canComplete ? 'btn-success' : 'btn-disabled'}`}
                onClick={handleMarkComplete}
                disabled={!canComplete}
                whileHover={canComplete ? { scale: 1.05 } : {}}
                whileTap={canComplete ? { scale: 0.95 } : {}}
              >
                {canComplete ? 'Mark as Complete' : 'Keep Learning...'}
              </motion.button>
            )}
          </div>

          {/* Progress Indicators */}
          {!isCompleted && (
            <div className="space-y-2">
              <div className="text-base-content/50 flex items-center justify-between text-xs">
                <span>Requirements to complete:</span>
              </div>

              <div className="grid gap-2">
                <div
                  className={`flex items-center gap-2 text-xs ${
                    readingTime >= 30 ? 'text-success' : 'text-base-content/60'
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      readingTime >= 30 ? 'bg-success' : 'bg-base-content/30'
                    }`}
                  ></div>
                  <span>
                    Read content for at least 30 seconds{' '}
                    {readingTime >= 30 ? '✓' : `(${30 - readingTime}s left)`}
                  </span>
                </div>

                {hasVideo && (
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      hasWatchedVideo ? 'text-success' : 'text-base-content/60'
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        hasWatchedVideo ? 'bg-success' : 'bg-base-content/30'
                      }`}
                    ></div>
                    <span>Watch the video {hasWatchedVideo ? '✓' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
