import { Appearance } from 'react-native';
import type { WidgetTaskHandler } from 'react-native-android-widget';

import { withBackgroundDb } from '@/lib/background-db';
import { rescheduleReminders, waterEverythingDue } from '@/lib/care-actions';

import { loadWidgetLook, loadWidgetModel } from './load-widget-model';
import { FallbackWidget, PlantaloonWidget, WATER_ACTION } from './plantaloon-widget';
import type { WidgetLook, WidgetModel } from './widget-model';

/** Android calls this to draw the widget (when added, resized, on its schedule) and on taps. */
export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetAction,
  widgetInfo,
  clickAction,
  renderWidget,
}) => {
  if (widgetAction === 'WIDGET_DELETED') return;
  // Until the settings are read: the phone's own mode with the default accent.
  let look: WidgetLook = { dark: Appearance.getColorScheme() === 'dark', accent: 'leaf' };
  try {
    const model: WidgetModel = await withBackgroundDb(async (db) => {
      look = await loadWidgetLook(db).catch(() => look);
      // "Watered"; the rest of the widget uses OPEN_APP, handled natively.
      if (widgetAction === 'WIDGET_CLICK' && clickAction === WATER_ACTION) {
        await waterEverythingDue(db).catch(() => 0);
      }
      // Every refresh, not just after "Watered": it keeps reminders planned ahead (and
      // overdue plants coming up again) even if the app itself isn't opened for weeks.
      // Nothing is rescheduled when the plan hasn't changed.
      await rescheduleReminders(db).catch(() => {});
      return loadWidgetModel(db).catch((): WidgetModel => ({ kind: 'empty' }));
    });
    renderWidget(
      <PlantaloonWidget
        model={model}
        look={look}
        width={widgetInfo.width}
        height={widgetInfo.height}
      />,
    );
  } catch (error) {
    console.error('Plantaloon widget failed to draw', error);
    renderWidget(<FallbackWidget look={look} />);
  }
};
