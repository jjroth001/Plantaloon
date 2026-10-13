import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { makePalette, type Palette } from '@/constants/theme';
import { useSettings } from '@/db/use-settings';
import { setHapticsEnabled } from '@/lib/haptics';

const PaletteContext = createContext<Palette>(makePalette(false, 'leaf'));

/** Colors from Settings › Appearance: light, dark or the phone's mode, plus the accent. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const scheme = useColorScheme();
  const mode = settings.data?.themeMode ?? 'system';
  const dark = mode === 'dark' || (mode === 'system' && scheme === 'dark');
  const palette = makePalette(dark, settings.data?.accent ?? 'leaf');
  const haptics = settings.data?.haptics ?? true;

  useEffect(() => setHapticsEnabled(haptics), [haptics]);

  // Nothing renders until settings load, so the first frame already has the right colors.
  if (settings.status === 'loading') return null;
  return <PaletteContext.Provider value={palette}>{children}</PaletteContext.Provider>;
}

export function useTheme(): Palette {
  return useContext(PaletteContext);
}
