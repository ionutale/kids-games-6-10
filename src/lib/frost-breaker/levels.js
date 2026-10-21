import { clampLevel } from '../ladder/progress.js';

/**
 * Ten sculptures on the shared ladder. All four pods are available from
 * level 1; later levels add counts and more complex silhouettes.
 */
export const LEVELS = [
  { level: 1, shape: 'star', pods: { spike: 3, ghost: 1, copter: 1, split: 1 } },
  { level: 2, shape: 'fish', pods: { spike: 3, ghost: 1, copter: 1, split: 1 } },
  { level: 3, shape: 'cat', pods: { spike: 3, ghost: 2, copter: 1, split: 1 } },
  { level: 4, shape: 'rocket', pods: { spike: 4, ghost: 1, copter: 2, split: 1 } },
  { level: 5, shape: 'castle', pods: { spike: 4, ghost: 2, copter: 1, split: 2 } },
  { level: 6, shape: 'snowman', pods: { spike: 4, ghost: 2, copter: 2, split: 1 } },
  { level: 7, shape: 'dinosaur', pods: { spike: 4, ghost: 2, copter: 2, split: 2 } },
  { level: 8, shape: 'butterfly', pods: { spike: 5, ghost: 2, copter: 2, split: 2 } },
  { level: 9, shape: 'lighthouse', pods: { spike: 5, ghost: 3, copter: 2, split: 2 } },
  { level: 10, shape: 'crown', pods: { spike: 5, ghost: 3, copter: 3, split: 3 } },
];

export function getLevel(n) {
  const level = clampLevel(n);
  return LEVELS[level - 1];
}
