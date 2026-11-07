import type { WithSpringConfig } from 'react-native-reanimated';

export const SPRING_CONFIG: WithSpringConfig = {
  damping: 20,
  stiffness: 260,
  mass: 1,
};

export const GROW_DURATION = 900;
export const MORPH_DURATION = 550;
export const STAGGER = 0.08;

export const BAR_COLORS = [
  '#38BDF8', // Sky Blue
  '#A78BFA', // Violet
  '#34D399', // Mint
  '#FBBF24', // Amber
  '#F472B6', // Rose
] as const;

export const TRACK_COLOR = 'rgba(255, 255, 255, 0.08)';
export const LABEL_COLOR = '#8A8A8E';
export const VALUE_COLOR = '#FFFFFF';

export const BAR_WIDTH = 8;
export const RING_GAP = 5;

export const START_ANGLE = 0;
export const CIRCLE_SWEEP = 360;
export const SEMICIRCLE_START = -90;
export const SEMICIRCLE_SWEEP = 180;

export const BOTTOM_INSET = 0;
export const RADIUS_INSET = 2;

export const TAU = Math.PI * 2;
export const ANGLE_ORIGIN = -Math.PI / 2;
export const EPSILON = 1e-4;
