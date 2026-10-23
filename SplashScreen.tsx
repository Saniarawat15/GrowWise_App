import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sprout } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900 text-white p-6">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        {/* Plant sprouting icon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="w-20 h-20 rounded-3xl bg-emerald-600/90 border border-emerald-400/30 flex items-center justify-center text-white shadow-2xl mb-6 relative overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 180 }}
          >
            <Sprout className="w-10 h-10 text-emerald-100" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="font-heading text-3xl font-extrabold tracking-tight text-white mb-2"
        >
          GrowWise
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-emerald-300 font-medium text-sm sm:text-base tracking-wide"
        >
          Grow with confidence. Learn with purpose.
        </motion.p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '120px' }}
          transition={{ delay: 0.8, duration: 1.2, ease: 'easeInOut' }}
          className="h-1 bg-emerald-500/50 rounded-full mt-8 overflow-hidden"
        >
          <div className="h-full w-full bg-emerald-400 animate-pulse" />
        </motion.div>
      </motion.div>
    </div>
  );
};
