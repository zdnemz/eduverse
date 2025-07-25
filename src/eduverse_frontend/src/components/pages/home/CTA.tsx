import { BackgroundWithDots } from '@/components/Background';
import { MOTION_TRANSITION } from '@/constants/motion';
import { cn } from '@/libs/utils';
import { motion } from 'framer-motion';
import { ArrowRightCircle, PlayCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CTA() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStartLearning = async () => {
    try {
      await login();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <section className="relative flex min-h-screen w-full items-center">
      <BackgroundWithDots />
      <div className="flex w-full flex-col space-y-6 lg:w-1/2">
        <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
          {'Start Learning & Own Your Skills Today!'.split(' ').map((word, index) => (
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
              className={cn('Skills').split(' ').includes(word) ? 'text-accent' : ''}
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
            'Join EduVerse now and get your first blockchain certificate for free. Be among the pioneers of decentralized education.'
          }
        </motion.p>
        <motion.div
          transition={{ ...MOTION_TRANSITION, delay: 1.2 }}
          initial={{ translateY: '20px', opacity: 0, filter: 'blur(10px)' }}
          whileInView={{ translateY: '0', opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          className="flex gap-x-4"
        >
          <button
            className="btn btn-primary flex items-center gap-2 rounded-lg"
            onClick={handleStartLearning}
          >
            {'Start Learning'}
            <ArrowRightCircle />
          </button>
          <button className="btn btn-secondary flex items-center gap-2 rounded-lg">
            {'Explore The Demo'}
            <PlayCircle />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
