import { BackgroundWithDots } from '@/components/Background';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RootLayout from '@/components/layouts/RootLayout';
import { withAuth } from '@/hoc/withAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useActor, usePrincipal, useIsAuthenticated } from '@/stores/auth-store';
import { getCertificate } from '@/services/auth-service';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';

import CertificateList from './CertificateList';
import CertificateDisplay from './CertificateDisplay';

export const CertificatePage = withAuth(function CertificatePage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <RootLayout
      className="min-h-screen w-full *:py-6 [&>*:first-child]:pt-24 [&>*:last-child]:pb-24"
      header={<Navbar />}
      footer={<Footer />}
      background={<BackgroundWithDots />}
    >
      <CertificateList onBack={handleBack} />
    </RootLayout>
  );
});

export const CertificateDetailRoute = withAuth(function CertificateDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const principal = usePrincipal();
  const actor = useActor();
  const isAuthenticated = useIsAuthenticated();

  const [certificate, setCertificate] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [localActor, setLocalActor] = useState<any>(null);

  // Initialize actor
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
        }
      }
    };

    initializeActor();
  }, [actor, isAuthenticated, principal]);

  // Fetch certificate data
  useEffect(() => {
    const fetchCertificate = async () => {
      if (!localActor || !id) return;

      try {
        setLoading(true);
        const result = await getCertificate(localActor);

        if (result) {
          const certificates = Array.isArray(result) ? result : [result];
          const foundCertificate = certificates.find((cert) => cert.tokenId === id);

          if (foundCertificate) {
            setCertificate(foundCertificate);
          }
        }

        // Fetch user profile for name
        try {
          const profileResult = await localActor.getMyProfile();
          if (profileResult && profileResult[0]) {
            const profile = profileResult[0];
            setUserName(profile.name || '');
          }
        } catch (error) {
          console.log('Could not fetch user profile:', error);
        }
      } catch (error) {
        console.error('Error fetching certificate:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [localActor, id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleViewCertificate = () => {
    if (certificate?.metadata?.image) {
      window.open(certificate.metadata.image, '_blank');
    }
  };

  const handleViewMaterials = () => {
    navigate(`/courses/${certificate?.courseId}`);
  };

  const handleChooseNewCourse = () => {
    navigate('/courses');
  };

  if (loading) {
    return (
      <RootLayout footer={<Footer />} background={<BackgroundWithDots />}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </RootLayout>
    );
  }

  if (!certificate) {
    return (
      <RootLayout footer={<Footer />} background={<BackgroundWithDots />}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">Certificate not found</h2>
            <button onClick={() => navigate('/certificate')} className="btn btn-primary">
              Back to Certificates
            </button>
          </div>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout background={<BackgroundWithDots />}>
      <CertificateDisplay
        certificate={certificate}
        onViewCertificate={handleViewCertificate}
        onViewMaterials={handleViewMaterials}
        onChooseNewCourse={handleChooseNewCourse}
        userName={userName}
        currentUserId={principal || ''}
      />
    </RootLayout>
  );
});
