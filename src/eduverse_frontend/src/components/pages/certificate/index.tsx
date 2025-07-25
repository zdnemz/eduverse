import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBackendActor } from '@/libs/actor';
import { BackgroundWithDots } from '@/components/Background';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import Loading from '@/components/Loading';

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
      <motion.div
        className="relative z-10 mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, translateY: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, translateY: 0, filter: 'blur(0px)' }}
        transition={{ ...MOTION_TRANSITION, delay: 0.2 }}
      >
        <h1 className="text-primary text-4xl font-bold">
          Start exploring and earn your certificate!
        </h1>
        <p className="text-base-content/80 mt-2 text-lg">
          Complete the learning modules to receive your certificate.
        </p>
      </motion.div>

      <motion.div
        className="relative z-10 mx-auto mt-10 max-w-xl"
        initial={{ opacity: 0, translateY: 30, filter: 'blur(10px)' }}
        animate={{ opacity: 1, translateY: 0, filter: 'blur(0px)' }}
        transition={{ ...MOTION_TRANSITION, delay: 0.4 }}
      >
        {loading ? (
          <div className="relative z-10 flex min-h-[300px] items-center justify-center">
            <Loading />
          </div>
        ) : !certificate ? (
          <motion.div
            className="card bg-base-200 p-6 text-center shadow-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...MOTION_TRANSITION, delay: 0.6 }}
          >
            <p className="text-warning text-xl font-semibold">
              ⚠️ You haven’t earned a certificate yet.
            </p>
            <p className="text-base-content/70 mt-2 text-base">
              Join the journey and get certified!
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="card bg-base-200 p-6 shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...MOTION_TRANSITION, delay: 0.6 }}
          >
            <h2 className="mb-4 text-2xl font-bold">🎓 Certificate of Completion</h2>
            <p className="text-lg">Awarded to:</p>
            <p className="text-xl font-semibold">{certificate.name}</p>
            <p className="text-md text-muted">Principal ID: {principal}</p>
            <p className="mt-4">Course: {certificate.course}</p>
            <p>Issued At: {new Date(Number(certificate.issued_at) / 1_000_000).toLocaleString()}</p>
          </motion.div>
        )}

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...MOTION_TRANSITION, delay: 0.8 }}
        >
          <button onClick={() => navigate('/')} className="btn btn-outline btn-primary">
            Return to Home Page
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
