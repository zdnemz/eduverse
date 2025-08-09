import { Declaration } from '@/types';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import { useState, useEffect } from 'react';
import { useLoading } from '@/hooks/useLoading';
import { CourseInfo } from 'declarations/eduverse_backend/eduverse_backend.did';

export async function getUser(actor: ActorSubclass<_SERVICE>) {
  try {
    const result = await actor.getMyProfile();
    console.log('Raw result from backend:', result);

    const user = result.length > 0 ? result[0] : null;

    if (user) {
      if ('admin' in user.role) {
        console.log('User role:', 'admin');
      } else if ('student' in user.role) {
        console.log('User role:', 'student');
      } else {
        console.log('User role:', 'unknown');
      }
    } else {
      console.log('No user found.');
    }

    return user;
  } catch (error) {
    console.error('get User error:', error);
    return null;
  }
}

export async function updateUser(
  actor: ActorSubclass<_SERVICE>,
  data: { name: string; email: string }
) {
  try {
    const result = await actor.updateUser(data.name, [data.email]);

    return result;
  } catch (error) {
    console.error('update User error:', error);
    return null;
  }
}

export async function getCertificate(actor: ActorSubclass<_SERVICE>) {
  try {
    const result = await actor.getMyCertificates();

    return result;
  } catch (error) {
    console.error('get Certificate error:', error);
    return null;
  }
}

export function useCourse(actor: ActorSubclass<_SERVICE>) {
  const [courses, setCourses] = useState<CourseInfo[]>([]);;
  const { startLoading, stopLoading } = useLoading('courses');

  useEffect(() => {
    const fetchCourses = async () => {
      if (!actor) return;
      startLoading();
      try {
        const result = await actor.getCourses();
        setCourses(result);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        stopLoading();
      }
    };

    fetchCourses();
  }, [actor, startLoading, stopLoading]);

  return courses;
}
