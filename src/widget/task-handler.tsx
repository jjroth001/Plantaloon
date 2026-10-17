import type { WidgetTaskHandler } from 'react-native-android-widget';

import { withBackgroundDb } from '@/lib/background-db';
import { rescheduleReminders, waterEverythingDue } from '@/lib/care-actions';

import { loadWidgetModel } from './load-widget-model';
import { FallbackWidget, PlantaloonWidget, WATER_ACTION } from './plantaloon-widget';
import type { WidgetModel } from './widget-model';

/** Android calls this to draw the widget (when added, resized, on its schedule) and on taps. */
export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetAction,
  widgetInfo,
  clickAction,
  renderWidget,
}) => {
  if (widgetAction === 'WIDGET_DELETED') return;
  try {
    const model: WidgetModel = await withBackgroundDb(async (db) => {
      // "Watered"; the rest of the widget uses OPEN_APP, handled natively.
      if (widgetAction === 'WIDGET_CLICK' && clickAction === WATER_ACTION) {
        const watered = await waterEverythingDue(db).catch(() => 0);
        if (watered > 0) await rescheduleReminders(db).catch(() => {});
      }
      return loadWidgetModel(db).catch((): WidgetModel => ({ kind: 'empty' }));
    });
    renderWidget(
      <PlantaloonWidget model={model} width={widgetInfo.width} height={widgetInfo.height} />,
    );
  } catch (error) {
    console.error('Plantaloon widget failed to draw', error);
    renderWidget(<FallbackWidget />);
  }
};
