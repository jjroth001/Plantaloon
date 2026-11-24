import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';

import { redrawWidgets, widgetsSupported } from './refresh';
import { buildWidgetModel, widgetLook, type WidgetLook, type WidgetModel } from './widget-model';

/**
 * Redraws any home-screen widgets whenever what they show changes, so watering a plant in
 * the app clears it from the widget right away (not at its next half-hourly refresh).
 * Renders nothing; mount once while the app runs.
 */
export function WidgetSync() {
  if (!widgetsSupported) return null;
  return <WidgetSyncInner />;
}

function WidgetSyncInner() {
  const today = useToday();
  // The garden the screens already share: no extra loading after each change.
  const garden = useGarden();
  const settings = useSettings();
  // Changing the theme or accent (or the phone's dark mode) recolors the widget too.
  const systemDark = useColorScheme() === 'dark';
  const key =
    garden.data && settings.data
      ? JSON.stringify({
          model: buildWidgetModel(garden.data, settings.data, today),
          look: widgetLook(settings.data, systemDark),
        })
      : null;

  useEffect(() => {
    if (key === null) return;
    const { model, look } = JSON.parse(key) as { model: WidgetModel; look: WidgetLook };
    redrawWidgets(model, look).catch(() => {
      // Best effort: the widget still refreshes on its own schedule.
    });
  }, [key]);

  return null;
}
