import { useEffect } from 'react';

import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';

import { redrawWidgets, widgetsSupported } from './refresh';
import { buildWidgetModel, type WidgetModel } from './widget-model';

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
  const key =
    garden.data && settings.data
      ? JSON.stringify(buildWidgetModel(garden.data, settings.data, today))
      : null;

  useEffect(() => {
    if (key === null) return;
    redrawWidgets(JSON.parse(key) as WidgetModel).catch(() => {
      // Best effort: the widget still refreshes on its own schedule.
    });
  }, [key]);

  return null;
}
