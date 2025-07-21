import { motion } from 'framer-motion';

export function BackgroundWithDots() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
      <div className="bg-base-300 absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:24px_24px]" />

      <motion.div
        className="absolute h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-40 blur-3xl"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -50, 100, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: 'mirror',
        }}
        style={{ top: '10%', left: '20%' }}
      />

      <motion.div
        className="absolute h-[24em] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,var(--color-secondary)_0%,transparent_70%)] opacity-40 blur-3xl"
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 60, -80, 0],
          scale: [1, 1.3, 0.8, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: 'mirror',
        }}
        style={{ bottom: '15%', right: '10%' }}
      />
    </div>
  );
}
