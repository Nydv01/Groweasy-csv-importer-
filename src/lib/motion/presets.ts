// ============================================================
// Motion Design System — Animation presets and spring configs
// ============================================================

export const motionPresets = {
  // Level 1: Micro interactions (120-220ms)
  micro: {
    duration: 0.15,
    ease: [0.25, 0.1, 0.25, 1] as const,
  },

  // Level 2: Standard UI transitions (220-400ms)
  standard: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as const,
  },

  // Level 3: Large spatial transitions (500-900ms)
  spatial: {
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1] as const,
  },

  // Level 4: Cinematic sequences (only for major moments)
  cinematic: {
    duration: 0.9,
    ease: [0.16, 1, 0.3, 1] as const,
  },
};

export const springPresets = {
  // Buttons, small interactions
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },

  // Cards, panels
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },

  // Drag feedback
  responsive: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },

  // Layout animations
  layout: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
};

// Stagger children
export function staggerChildren(staggerTime = 0.05) {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerTime,
      },
    },
  };
}

export function fadeInUp(delay = 0) {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...motionPresets.standard,
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
        duration: 0.3,
        delay,
      },
    },
  };
}

export function scaleIn(delay = 0) {
  return {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        ...motionPresets.standard,
        delay,
      },
    },
  };
}
