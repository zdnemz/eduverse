import { Declaration } from '@/types';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import { useState, useEffect } from 'react';
import { useLoading } from '@/hooks/useLoading';
import { CourseInfo } from 'declarations/eduverse_backend/eduverse_backend.did';

// Helper to convert BigInt to string recursively
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }

  return obj;
};

export async function getUser(actor: ActorSubclass<_SERVICE>) {
  try {
    const result = await actor.getMyProfile();
    console.log('Raw result from backend:', result);

    if (result.length > 0) {
      const user = convertBigIntToString(result[0]);
      console.log('Converted user data:', user);
      return user;
    }

    return null;
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
    return convertBigIntToString(result);
  } catch (error) {
    console.error('update User error:', error);
    return null;
  }
}

export async function getCertificate(actor: ActorSubclass<_SERVICE>) {
  try {
    const result = await actor.getMyCertificates();
    return convertBigIntToString(result);
  } catch (error) {
    console.error('get Certificate error:', error);
    return null;
  }
}

export function useCourse(actor: ActorSubclass<_SERVICE>) {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const { startLoading, stopLoading } = useLoading('courses');

  useEffect(() => {
    const fetchCourses = async () => {
      if (!actor) return;
      startLoading();
      try {
        const result = await actor.getCourses();
        const convertedCourses = convertBigIntToString(result);
        setCourses(convertedCourses);
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
