import { useState, useEffect } from 'react';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE, CourseInfo } from 'declarations/eduverse_backend/eduverse_backend.did';

export const useCourses = (actor: ActorSubclass<_SERVICE> | null) => {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await actor.getCourses();
        setCourses(result);
      } catch (err) {
        setError('Failed to fetch courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [actor]);

  return { courses, loading, error };
};

// Alternative difficulty text helper functions for different DID structures
export const getDifficultyTextAlt = (difficulty: any): string => {
  // If difficulty is a string directly
  if (typeof difficulty === 'string') return difficulty;

  // If difficulty is an object with keys
  if (difficulty?.Beginner !== undefined) return 'Beginner';
  if (difficulty?.Intermediate !== undefined) return 'Intermediate';
  if (difficulty?.Advanced !== undefined) return 'Advanced';

  // Default fallback
  return 'Beginner';
};
