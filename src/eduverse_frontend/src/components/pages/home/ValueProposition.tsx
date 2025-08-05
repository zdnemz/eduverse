import { BadgeCheck, Infinity, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import React from 'react';

const featuresData = [
  {
    icon: ShieldCheck,
    title: 'Decentralized & Secure',
    description: 'Your learning records are stored on ICP blockchain, tamper-proof and permanent.',
  },
  {
    icon: BadgeCheck,
    title: 'Verifiable NFT Certificates',
    description: 'Showcase your skills with certificates employers can instantly verify.',
  },
  {
    icon: Sparkles,
    title: 'Motivating Learning Journey',
    description:
      'Complete quizzes, unlock certificates, and soon earn token rewards for consistent learning.',
  },
  {
    icon: Infinity,
    title: 'Own Your Education',
    description: 'No more lost or fake certificates—your learning record lives with you forever.',
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      transition={MOTION_TRANSITION}
      initial={{ translateY: '20px', opacity: 0, filter: 'blur(10px)' }}
      whileInView={{ translateY: '0', opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      className="card bg-base-300/70 shadow-primary shadow"
    >
      <div className="card-body items-start gap-3">
        <Icon className="text-primary h-6 w-6" aria-label={title} />
        <h3 className="card-title">{title}</h3>
        <p className="text-muted text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

export default function ValueProposition() {
  return (
    <section className="from-base-200 via-base-300 to-base-300 shadow-primary relative bg-gradient-to-br shadow">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h2>Why EduVerse?</h2>
        <p className="text-muted mx-auto max-w-md text-sm">
          We bring
          <span className="text-primary font-semibold"> blockchain-powered credentials </span>
          to ensure your achievements are
          <span className="italic"> verifiable</span>,<span className="italic"> secure</span>, and
          <span className="italic"> truly yours forever</span>.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {featuresData.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}
