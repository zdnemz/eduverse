import { useEffect, useState } from 'react';
import { BackgroundWithDots } from '@/components/Background';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import RootLayout from '@/components/layouts/RootLayout';
import { useLoading } from '@/hooks/useLoading';
import { useActor, usePrincipal, useIsAuthenticated } from '@/stores/auth-store';
import { getCertificate } from '@/services/auth-service';
import {
  ChevronLeftCircle,
  Award,
  Calendar,
  Trophy,
  ExternalLink,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';

export default function CertificatePage() {
  const principal = usePrincipal();
  const actor = useActor();
  const isAuthenticated = useIsAuthenticated();

  const [certificates, setCertificates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [localActor, setLocalActor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { startLoading, stopLoading } = useLoading('certificate');
  const navigate = useNavigate();

  // Recreate actor if needed (after page refresh)
  useEffect(() => {
    const initializeActor = async () => {
      if (actor) {
        setLocalActor(actor);
        return;
      }

      if (isAuthenticated && principal && !actor) {
        try {
          const client = await getAuthClient();
          const identity = client.getIdentity();
          const newActor = await createActor(identity);
          setLocalActor(newActor);
        } catch (error) {
          console.error('Failed to recreate actor:', error);
          setError('Failed to initialize authentication. Please try logging in again.');
        }
      }
    };

    initializeActor();
  }, [actor, isAuthenticated, principal]);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!localActor) return;

      try {
        setIsLoading(true);
        startLoading();
        setError(null);

        console.log('Fetching certificates with actor:', localActor);
        const result = await getCertificate(localActor);
        console.log('Certificates result:', result);

        if (result) {
          if (Array.isArray(result)) {
            setCertificates(result);
          } else {
            setCertificates([result]);
          }
        } else {
          setCertificates([]);
        }
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch certificates');
        setCertificates([]);
      } finally {
        setIsLoading(false);
        stopLoading();
      }
    };

    fetchCertificates();
  }, [localActor]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const formatDate = (timestamp: string) => {
    try {
      return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getScoreColor = (score: string) => {
    const numScore = parseInt(score);
    if (numScore >= 90) return 'text-success';
    if (numScore >= 80) return 'text-warning';
    if (numScore >= 70) return 'text-info';
    return 'text-error';
  };

  const handleViewCertificate = (certificate: any) => {
    if (certificate.metadata?.image) {
      window.open(certificate.metadata.image, '_blank');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <RootLayout>
        <section className="relative min-h-screen overflow-hidden px-4 py-12">
          <BackgroundWithDots />
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4 text-lg">Loading your certificates...</p>
          </div>
        </section>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <section className="relative min-h-screen overflow-hidden px-4 py-12">
        <BackgroundWithDots />

        {/* Simple Header */}
        <motion.div
          className="relative z-10 mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...MOTION_TRANSITION, delay: 0.2 }}
        >
          <div className="mb-4 flex items-center justify-center gap-3">
            <Award className="text-primary h-8 w-8" />
            <h1 className="text-primary text-4xl font-bold">Your Certificates</h1>
          </div>
          <p className="text-base-content/70 mb-8 text-lg">
            Your earned certificates and achievements
          </p>

          {/* Simple Stats */}
          {certificates.length > 0 && (
            <div className="mb-8 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">{certificates.length}</div>
                <div className="text-base-content/60 text-sm">Certificates</div>
              </div>
              <div className="text-center">
                <div className="text-success text-2xl font-bold">
                  {Math.round(
                    certificates.reduce((acc, cert) => acc + parseInt(cert.finalScore || '0'), 0) /
                      certificates.length
                  )}
                  %
                </div>
                <div className="text-base-content/60 text-sm">Average Score</div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="relative z-10 mx-auto mt-8 max-w-6xl"
          initial={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...MOTION_TRANSITION, delay: 0.4 }}
        >
          {/* Error State */}
          {error && (
            <div className="alert alert-error mb-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
              <button onClick={() => window.location.reload()} className="btn btn-sm">
                Try Again
              </button>
            </div>
          )}

          {/* No Certificates State */}
          {!error && certificates.length === 0 && (
            <div className="py-16 text-center">
              <Award className="text-base-content/30 mx-auto mb-4 h-16 w-16" />
              <h2 className="text-base-content/60 mb-2 text-2xl font-bold">No certificates yet</h2>
              <p className="text-base-content/50 mb-6">
                Complete courses to earn your first certificate!
              </p>
              <button onClick={() => navigate('/courses')} className="btn btn-primary">
                Browse Courses
              </button>
            </div>
          )}

          {/* Clean Certificates Grid */}
          {certificates.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {certificates.map((certificate, index) => (
                <motion.div
                  key={certificate.tokenId || index}
                  className="card bg-base-100 border-base-content/10 border shadow-lg transition-shadow hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...MOTION_TRANSITION, delay: 0.6 + index * 0.1 }}
                >
                  <div className="card-body p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="badge badge-primary">NFT #{certificate.tokenId}</div>
                      <div className={`text-xl font-bold ${getScoreColor(certificate.finalScore)}`}>
                        {certificate.finalScore}%
                        {parseInt(certificate.finalScore) === 100 && (
                          <CheckCircle className="ml-1 inline h-5 w-5" />
                        )}
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="mb-4">
                      <h3 className="text-primary mb-2 line-clamp-2 text-lg font-bold">
                        {certificate.courseName}
                      </h3>
                      <div className="text-base-content/60 text-sm">{certificate.issuer}</div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="text-base-content/60 h-4 w-4" />
                        <span>Completed: {formatDate(certificate.completedAt)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="text-base-content/60 h-4 w-4" />
                        <span>Course ID: {certificate.courseId}</span>
                      </div>
                    </div>

                    {/* Certificate Hash (Collapsed) */}
                    <div className="collapse-arrow bg-base-200 collapse mt-4">
                      <input type="checkbox" />
                      <div className="collapse-title text-sm font-medium">Certificate Hash</div>
                      <div className="collapse-content">
                        <p className="text-base-content/80 font-mono text-xs break-all">
                          {certificate.certificateHash}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="card-actions mt-6 justify-end">
                      {certificate.metadata?.image && (
                        <button
                          onClick={() => handleViewCertificate(certificate)}
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </button>
                      )}
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-sm">
                          <Share2 className="h-4 w-4" />
                        </label>
                        <ul
                          tabIndex={0}
                          className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow"
                        >
                          <li>
                            <a>Copy Link</a>
                          </li>
                          <li>
                            <a>Download PDF</a>
                          </li>
                          <li>
                            <a>Share on LinkedIn</a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Back Button */}
          <div className="mt-12 text-center">
            <button onClick={() => navigate('/')} className="btn btn-primary">
              <ChevronLeftCircle className="h-5 w-5" />
              Return to Home
            </button>
          </div>
        </motion.div>
      </section>
    </RootLayout>
  );
}
