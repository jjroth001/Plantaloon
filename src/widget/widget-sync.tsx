import { useEffect } from 'react';

import { useDbQuery } from '@/db/use-db-query';
import { useToday } from '@/hooks/use-today';

import { loadWidgetModel } from './load-widget-model';
import { redrawWidgets, widgetsSupported } from './refresh';
import type { WidgetModel } from './widget-model';

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
  const model = useDbQuery(
    ['room', 'plant', 'schedule', 'entry', 'setting'],
    (db) => loadWidgetModel(db),
    [today],
  );
  const key = model.status === 'success' ? JSON.stringify(model.data) : null;

  useEffect(() => {
    if (key === null) return;
    redrawWidgets(JSON.parse(key) as WidgetModel).catch(() => {
      // Best effort: the widget still refreshes on its own schedule.
    });
  }, [key]);

  return null;
}
