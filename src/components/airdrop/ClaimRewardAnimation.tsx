import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  points: number;
  show: boolean;
}

export const ClaimRewardAnimation: React.FC<Props> = ({ points, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 0, scale: 0.5 }}
        animate={{ opacity: 1, y: -60, scale: 1.2 }}
        exit={{ opacity: 0, y: -120, scale: 0.8 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] pointer-events-none"
      >
        <div className="text-4xl sm:text-5xl font-black text-primary drop-shadow-lg">
          +{points} pts! 🎉
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
