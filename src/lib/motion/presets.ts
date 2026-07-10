// ============================================================
// Motion Design System — Premium Animation Presets
// ============================================================

export const motionPresets = {
  // Level 1: Micro interactions (100-180ms)
  micro: {
    duration: 0.12,
    ease: [0.25, 0.1, 0.25, 1] as const,
  },

  // Level 2: Standard UI transitions (200-350ms)
  standard: {
    duration: 0.25,
    ease: [0.4, 0, 0.2, 1] as const,
  },

  // Level 3: Spatial transitions (400-700ms)
  spatial: {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1] as const,
  },

  // Level 4: Cinematic sequences (700-1200ms)
  cinematic: {
    duration: 0.9,
    ease: [0.16, 1, 0.3, 1] as const,
  },

  // Level 5: Dramatic reveals
  dramatic: {
    duration: 1.2,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

export const springPresets = {
  // Buttons, toggles
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 28,
  },

  // Cards, panels
  gentle: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 22,
  },

  // Drag feedback
  responsive: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },

  // Layout shifts
  layout: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },

  // Bouncy, playful
  bouncy: {
    type: 'spring' as const,
    stiffness: 350,
    damping: 18,
  },

  // Elastic snap-back
  elastic: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 15,
  },
};

// Stagger children
export function staggerChildren(staggerTime = 0.06) {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerTime,
        delayChildren: 0.1,
      },
    },
  };
}

export function fadeInUp(delay = 0) {
  return {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...motionPresets.spatial,
        delay,
      },
    },
  };
}

export function fadeIn(delay = 0) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        delay,
      },
    },
  };
}

export function scaleIn(delay = 0) {
  return {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        ...motionPresets.spatial,
        delay,
      },
    },
  };
}

export function slideInLeft(delay = 0) {
  return {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        ...motionPresets.spatial,
        delay,
      },
    },
  };
}

export function slideInRight(delay = 0) {
  return {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        ...motionPresets.spatial,
        delay,
      },
    },
  };
}

// Glow pulse for processing indicators
export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(52,211,153,0.1)',
      '0 0 40px rgba(52,211,153,0.25)',
      '0 0 20px rgba(52,211,153,0.1)',
    ],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Float animation for idle elements
export const floatAnimation = {
  animate: {
    y: [-4, 4, -4],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};
