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

export function BackgroundGridBlob() {
  return (
    <div className="absolute inset-0 -z-10">
      {/* Base gradient with subtle patterns
       */}
      <div className="from-base-100 via-base-200 to-base-300 absolute inset-0 bg-gradient-to-br" />

      {/* Animated mesh gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
                  radial-gradient(circle at 25% 25%, var(--color-primary) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, var(--color-secondary) 0%, transparent 50%),
                  radial-gradient(circle at 75% 25%, var(--color-accent) 0%, transparent 50%),
                  radial-gradient(circle at 25% 75%, var(--color-info) 0%, transparent 50%)
                `,
        }}
        animate={{
          backgroundPosition: [
            '25% 25%, 75% 75%, 75% 25%, 25% 75%',
            '30% 30%, 80% 70%, 70% 30%, 30% 80%',
            '35% 25%, 75% 80%, 80% 25%, 20% 75%',
            '25% 25%, 75% 75%, 75% 25%, 25% 75%',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating geometric shapes */}
      <motion.div
        className="border-primary/20 absolute top-10 left-10 h-16 w-16 rounded-lg border"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="bg-secondary/10 absolute top-32 right-16 h-12 w-12 rounded-full"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="border-accent/15 absolute bottom-20 left-20 h-20 w-20 rounded-full border-2"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -180, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="bg-info/20 absolute right-32 bottom-32 h-8 w-8 rounded-sm"
        animate={{
          rotate: [45, 225, 45],
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
                  linear-gradient(var(--color-base-content) 1px, transparent 1px),
                  linear-gradient(90deg, var(--color-base-content) 1px, transparent 1px)
                `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
