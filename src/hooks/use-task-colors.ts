import type { Task } from '@/lib/schedule';
import { useTheme } from '@/theme/theme-provider';

/** Water is blue and feeding amber everywhere; other tasks use the accent color. */
export function useTaskColors(task: Task): { color: string; soft: string } {
  const theme = useTheme();
  if (task === 'water') return { color: theme.water, soft: theme.waterSoft };
  if (task === 'fertilize') return { color: theme.fertilize, soft: theme.fertilizeSoft };
  return { color: theme.tint, soft: theme.tintSoft };
}
