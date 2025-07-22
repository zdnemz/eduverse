import { motion } from 'framer-motion';
import { Marquee } from '@/components/ui/marquee';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    text: 'This platform has completely changed the way I learn. The materials are clear and interactive!',
    name: 'Andi Pratama',
  },
  {
    text: 'Perfect for beginners. The step-by-step learning system is easy to follow.',
    name: 'Rina Wijaya',
  },
  {
    text: 'The quizzes are addictive, and the NFT certificate is super cool!',
    name: 'Budi Santoso',
  },
  {
    text: 'Quick support and an active community. Highly recommended!',
    name: 'Siti Nurhaliza',
  },
];

export default function Testimonials() {
  return (
    <section className="from-base-200 to-blue-base-300 relative grid w-full gap-4 bg-gradient-to-r">
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl">What Our Users Say</h2>
        <p className="text-muted text-sm">
          Some testimonials from those who have tried our platform
        </p>
      </div>

      <Marquee pauseOnHover className="flex items-center gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            type: 'spring',
          }}
          className="flex items-center gap-6"
        >
          {testimonials.map((item, index) => (
            <div key={index} className="card bg-base-300/70 shadow-primary h-52 w-60 shadow">
              <div className="card-body flex w-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <Quote className="text-primary/30 h-8 w-8" />
                </div>
                <p className="italic">{item.text}</p>
                <h3 className="mt-2 text-right text-sm font-semibold">{item.name}</h3>
              </div>
            </div>
          ))}
        </motion.div>
      </Marquee>
    </section>
  );
}
