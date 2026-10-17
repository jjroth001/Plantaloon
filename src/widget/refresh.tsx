import { Platform } from 'react-native';

import { remindersSupported } from '@/lib/notifications';

import { WIDGET_NAME, type WidgetModel } from './widget-model';

/** Widgets need Plantaloon's own native code: installed Android builds only, not Expo Go. */
export const widgetsSupported = Platform.OS === 'android' && remindersSupported;

/** Redraws any home-screen widgets with `model`. Safe to call when there are none. */
export async function redrawWidgets(model: WidgetModel): Promise<void> {
  if (!widgetsSupported) return;
  // Loaded lazily: these modules touch native code that doesn't exist in Expo Go.
  const [{ requestWidgetUpdate }, { FallbackWidget, PlantaloonWidget }] = await Promise.all([
    import('react-native-android-widget'),
    import('./plantaloon-widget'),
  ]);
  // The library turns the element into a widget after renderWidget returns, so a drawing
  // error surfaces from requestWidgetUpdate itself; fall back rather than stay blank.
  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: (info) => (
        <PlantaloonWidget model={model} width={info.width} height={info.height} />
      ),
    });
  } catch (error) {
    console.error('Plantaloon widget failed to draw', error);
    await requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: () => <FallbackWidget /> });
  }
}
