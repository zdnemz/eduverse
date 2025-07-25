import * as React from 'react';
import { MOTION_TRANSITION } from '@/constants/motion';
import { motion } from 'framer-motion';
import { BookOpen, LogIn, Share2, Stamp } from 'lucide-react';
import { useRefContext } from '@/contexts/RefContext';
import { BackgroundGridBlob } from '@/components/Background';
import { useAuth } from '@/contexts/AuthContext';

const steps = [
  {
    icon: <LogIn />,
    title: 'Login with Internet Identity',
    desc: "Sign in securely using ICP's Internet Identity and get your unique Principal ID.",
  },
  {
    icon: <BookOpen />,
    title: 'Learn & Complete Quizzes',
    desc: 'Access interactive lessons, complete quizzes, and track your progress in real-time.',
  },
  {
    icon: <Stamp />,
    title: 'Claim Your NFT Certificate',
    desc: 'After passing, claim your blockchain-verified NFT certificate stored on ICP.',
  },
  {
    icon: <Share2 />,
    title: 'Showcase & Share',
    desc: 'View your NFT certificates in your wallet and share them with employers or on social media.',
  },
];

export default function HowItWorks() {
  const { registerRef } = useRefContext();
  const howItWorksSectionRef = registerRef('howItWorksSection');
  const { login } = useAuth();

  return (
    <section
      className="relative grid gap-4 overflow-hidden border-y lg:grid-cols-2"
      ref={howItWorksSectionRef as React.LegacyRef<HTMLElement>}
    >
      <BackgroundGridBlob />

      {/* Heading */}
      <div className="mx-auto max-w-2xl space-y-4 text-center lg:mx-0 lg:text-start">
        <h2>How EduVerse Works</h2>
        <p className="text-muted text-sm">From learning to earning—only 4 simple steps.</p>
        <button onClick={login} className="btn btn-primary rounded-lg">
          Get Started Now
        </button>
      </div>

      {/* Steps */}
      <div>
        <div className="relative space-y-4">
          {/* Progressive Line */}
          <motion.div
            className="bg-base-content absolute ml-3 w-px"
            transition={{
              delay: 0.2,
              duration: 1,
              ease: 'easeIn',
            }}
            initial={{ height: '0%' }}
            whileInView={{ height: '100%' }}
            viewport={{ once: true, amount: 0.2 }}
          />
          {steps.map((step, index) => (
            <div key={index} className="relative ml-6 py-6">
              {/* Circle */}
              <motion.div
                className="bg-base-content absolute -left-5 h-4 w-4 rounded-full"
                transition={MOTION_TRANSITION}
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                whileInView={{
                  opacity: 1,
                  scale: 1,
                }}
                viewport={{ once: true, amount: 0.2 }}
              />
              {/* Text */}
              <motion.div
                className="pl-4"
                transition={MOTION_TRANSITION}
                initial={{
                  translateX: '20px',
                  opacity: 0,
                  filter: 'blur(10px)',
                }}
                whileInView={{
                  translateX: '0',
                  opacity: 1,
                  filter: 'blur(0px)',
                }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  {step.icon}
                  <h3 className="font-bold">{step.title}</h3>
                </div>
                <p className="text-muted text-xs">{step.desc}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
