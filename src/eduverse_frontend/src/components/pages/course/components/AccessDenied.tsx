// AccessDenied.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader } from 'lucide-react';
import { PersistentUserState } from './UserStateManager';

interface AccessDeniedProps {
  error: string | null;
  isEnrolled: boolean;
  isEnrolling: boolean;
  persistentUserState: PersistentUserState | null;
  onEnroll: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  error,
  isEnrolled,
  isEnrolling,
  persistentUserState,
  onEnroll,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <div className="max-w-md rounded-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-base-content mb-4 text-xl font-bold">Access Required</h2>
        <p className="text-accent mb-6">
          {error || 'You need to enroll in this course to access the materials'}
        </p>

        {/* Enhanced User Identity Display with Persistent State */}
        {persistentUserState && (
          <div className="mb-4 rounded-lg bg-slate-100 p-3">
            <div className="text-xs text-gray-500">Current User</div>
            <div className="text-sm font-medium text-gray-700">{persistentUserState.userName}</div>
            <div className="font-mono text-xs text-gray-500">
              ID: {persistentUserState.userId.slice(0, 20)}...
              {persistentUserState.userId.slice(-8)}
            </div>
            <div className="text-xs text-green-600">
              Session Active • Last seen:{' '}
              {new Date(persistentUserState.lastSeen).toLocaleTimeString()}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          {!error && !isEnrolled && (
            <button
              onClick={onEnroll}
              disabled={isEnrolling}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isEnrolling && <Loader className="h-4 w-4 animate-spin" />}
              {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
          <Link
            to="/dashboard"
            className="rounded-lg border border-gray-300 bg-gray-100 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
