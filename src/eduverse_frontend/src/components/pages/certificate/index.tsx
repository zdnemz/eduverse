import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBackendActor } from '@/libs/actor';
import { BackgroundWithDots } from '@/components/Background';
import { useNavigate } from 'react-router-dom';

export default function CertificatePage() {
  const { principal } = useAuth();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const actor = await createBackendActor();
        const result = await actor.getCertificate();
        setCertificate(result);
      } catch (error) {
        console.error('Error fetching certificate:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-12">
      <BackgroundWithDots />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h1 className="text-primary text-4xl font-bold">
          Start exploring and earn your certificate!
        </h1>
        <p className="text-base-content/80 mt-2 text-lg">
          Complete the learning modules to receive your certificate.
        </p>
      </div>
      <div className="relative z-10 mx-auto mt-10 max-w-xl">
        {loading ? (
          <div className="text-base-content text-center">Loading certificate...</div>
        ) : !certificate ? (
          <div className="card bg-base-200 p-6 text-center shadow-md">
            <p className="text-warning text-xl font-semibold">
              ⚠️ You haven’t earned a certificate yet.
            </p>
            <p className="text-base-content/70 mt-2 text-base">
              Join the journey and get certified!
            </p>
          </div>
        ) : (
          <div className="card bg-base-200 p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold">🎓 Certificate of Completion</h2>
            <p className="text-lg">Awarded to:</p>
            <p className="text-xl font-semibold">{certificate.name}</p>
            <p className="text-md text-muted">Principal ID: {principal}</p>
            <p className="mt-4">Course: {certificate.course}</p>
            <p>Issued At: {new Date(Number(certificate.issued_at) / 1_000_000).toLocaleString()}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="btn btn-outline btn-primary">
            Return to Home Page
          </button>
        </div>
      </div>
    </section>
  );
}
