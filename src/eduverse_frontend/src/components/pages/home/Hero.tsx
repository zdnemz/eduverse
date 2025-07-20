import { motion } from 'framer-motion';
import { useRefContext } from '@/contexts/RefContext';
import { MOTION_TRANSITION } from '@/constants/motion';
import { cn } from '@/libs/utils';
import { BackgroundWithDots } from '@/components/Background';

export default function Hero() {
  const { scrollToRef } = useRefContext();

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center">
      <BackgroundWithDots />

      <div className="flex w-full flex-col space-y-6 lg:w-1/2">
        <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
          {'Learn, Graduate, Get a Verified Certificate'.split(' ').map((word, index) => (
            <motion.span
              key={index}
              transition={{ ...MOTION_TRANSITION, delay: index * 0.2 }}
              initial={{
                opacity: 0,
                transform: 'translateY(10px)',
                filter: 'blur(10px)',
              }}
              whileInView={{
                opacity: 1,
                transform: 'translateY(0)',
                filter: 'blur(0px)',
              }}
              viewport={{ once: true, amount: 0.2 }}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
              className={cn('Verified Certificate').split(' ').includes(word) ? 'text-accent' : ''}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <motion.p
          transition={{ ...MOTION_TRANSITION, delay: 1 }}
          initial={{ translateY: '20px', opacity: 0, filter: 'blur(10px)' }}
          whileInView={{ translateY: '0', opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
        >
          {
            "A modern learning platform powered by blockchain technology. Earn an NFT certificate that's permanently recorded on the ICP network."
          }
        </motion.p>
        <motion.div
          transition={{ ...MOTION_TRANSITION, delay: 1.2 }}
          initial={{ translateY: '20px', opacity: 0, filter: 'blur(10px)' }}
          whileInView={{ translateY: '0', opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          className="flex gap-x-4"
        >
          <button className="btn btn-primary rounded-lg">{'Start Learning Now'}</button>
          <button
            onClick={() => scrollToRef('howItWorksSection')}
            className="btn btn-secondary rounded-lg"
          >
            {'See How It Works'}
          </button>
        </motion.div>
        <motion.p
          transition={{ ...MOTION_TRANSITION, delay: 1.4 }}
          initial={{ translateY: '20px', opacity: 0, filter: 'blur(10px)' }}
          whileInView={{ translateY: '0', opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-base-content/75 flex text-xs"
        >
          Trusted by 15,000+ Developers & Professionals
        </motion.p>
      </div>

      <div className="hidden w-1/2 items-center justify-center lg:flex">
        <div className="bg-base-100 flex h-[450px] w-[450px] items-center justify-center rounded-full shadow-2xl">
          <p className="text-base-content/50 text-2xl font-bold">Illustration here</p>
        </div>
      </div>
    </section>
  );
}
