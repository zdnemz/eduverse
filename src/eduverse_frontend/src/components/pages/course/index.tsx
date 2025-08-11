// pages/course/index.tsx
import { useParams, useNavigate } from 'react-router-dom';
import CourseDetailView from './CourseDetailView';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const numericCourseId = courseId ? parseInt(courseId, 10) : 0;

  if (!courseId || isNaN(numericCourseId)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-error text-2xl font-bold">Course Not Found</h1>
          <p className="text-base-content/70 mt-2">Invalid course ID</p>
          <button onClick={handleBack} className="btn btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <CourseDetailView courseId={numericCourseId} onBack={handleBack} />;
}
