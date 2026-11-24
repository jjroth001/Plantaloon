// The widget library calls these components as plain functions, so the React Compiler
// (on for the rest of the app) must not rewrite them with hooks — that throws
// "Invalid hook call" and the widget is never drawn.
'use no memo';

import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import type { IconName } from '@/components/icons/icon';
import { PHOSPHOR } from '@/components/icons/phosphor-paths';
import { makePalette } from '@/constants/theme';

import type { WidgetLook, WidgetModel, WidgetRow } from './widget-model';

/** Tapping "Watered" on the widget. */
export const WATER_ACTION = 'WATER_ALL';

const RADIUS = 24;

/**
 * The title font, built into installed builds (assets/fonts) by the expo-font plugin in
 * app.json. If it's ever missing, Android falls back to the phone's font.
 */
const TITLE_FONT = 'Fredoka_600SemiBold';

/** The default 4×2 widget on a typical phone, in dp; text scales from this. */
const BASE_WIDTH = 330;
const BASE_HEIGHT = 170;

/** Widget colours must be #RRGGBB or "rgba(r, g, b, a)" with spaces, as the library expects. */
type WidgetColor = `#${string}` | `rgba(${number}, ${number}, ${number}, ${number})`;
function widgetColor(color: string): WidgetColor {
  if (color.startsWith('#')) return color as WidgetColor;
  return color.replace(/\s/g, '').replace(/,/g, ', ') as WidgetColor;
}

/** The app's own colors for this look, in the widget's format. */
function colorsFor(look: WidgetLook) {
  const p = makePalette(look.dark, look.accent);
  return {
    bg: widgetColor(p.card),
    text: widgetColor(p.text),
    muted: widgetColor(p.textSecondary),
    accent: widgetColor(p.tint),
    onAccent: widgetColor(p.onTint),
    row: widgetColor(p.element),
    water: widgetColor(p.water),
    fertilize: widgetColor(p.fertilize),
  };
}

type Colors = ReturnType<typeof colorsFor>;

function textScale(width?: number, height?: number): number {
  if (!width || !height) return 1;
  return Math.min(1.5, Math.max(0.85, Math.min(width / BASE_WIDTH, height / BASE_HEIGHT)));
}

/** A Phosphor icon (duotone, like the app) as an SVG string for the widget. */
function iconSvg(name: IconName, color: string, size: number): string {
  const { duo, solid } = PHOSPHOR[name];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">` +
    duo.map((d) => `<path d="${d}" fill="${color}" opacity="0.2"/>`).join('') +
    solid.map((d) => `<path d="${d}" fill="${color}"/>`).join('') +
    '</svg>'
  );
}

type Props = { model: WidgetModel; look: WidgetLook; width?: number; height?: number };

/**
 * Home-screen widget: what the plants need today, or "All caught up". Tapping it opens the
 * app; "Watered" marks everything that needs water as done. Only loaded in installed builds.
 * It wears the app's colors: light or dark as set in Settings, with the chosen accent.
 */
export function PlantaloonWidget({ model, look, width, height }: Props) {
  const c = colorsFor(look);
  const s = textScale(width, height);
  const size = (base: number) => Math.round(base * s);
  const ready = model.kind === 'ready' ? model : null;
  const due = ready ? ready.rows.length : 0;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Open Plantaloon"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.bg,
        borderRadius: RADIUS,
        paddingHorizontal: size(14),
        paddingVertical: size(12),
        flexDirection: 'column',
      }}>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <SvgWidget
          svg={iconSvg('potted-plant', c.accent, size(20))}
          style={{ width: size(20), height: size(20) }}
        />
        <TextWidget
          text={due ? '  Today' : '  Plantaloon'}
          style={{ fontSize: size(18), fontFamily: TITLE_FONT, color: c.text }}
          maxLines={1}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
          width: 'match_parent',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
        {!ready ? (
          <TextWidget
            text="Add a plant to see its care here"
            style={{ fontSize: size(14), color: c.muted }}
          />
        ) : due === 0 ? (
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SvgWidget
              svg={iconSvg('check-circle', c.accent, size(22))}
              style={{ width: size(22), height: size(22) }}
            />
            <FlexWidget style={{ flexDirection: 'column' }}>
              <TextWidget
                text="  All caught up"
                style={{ fontSize: size(16), fontWeight: '600', color: c.text }}
              />
              {ready.next ? (
                <TextWidget
                  text={`  Next: ${ready.next.toLowerCase()}`}
                  style={{ fontSize: size(13), color: c.muted }}
                />
              ) : null}
            </FlexWidget>
          </FlexWidget>
        ) : (
          <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
            {ready.rows.map((row) => (
              <Row key={row.key} row={row} colors={c} size={size} />
            ))}
            {ready.more > 0 ? (
              <TextWidget
                text={`+ ${ready.more} more`}
                style={{ fontSize: size(12), color: c.muted }}
              />
            ) : null}
          </FlexWidget>
        )}
      </FlexWidget>

      {ready && ready.waterDue > 0 ? (
        <FlexWidget
          clickAction={WATER_ACTION}
          accessibilityLabel="Mark everything that needs water as watered"
          style={{
            width: 'match_parent',
            height: size(36),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.accent,
            borderRadius: size(18),
          }}>
          <SvgWidget
            svg={iconSvg('drop', c.onAccent, size(16))}
            style={{ width: size(16), height: size(16) }}
          />
          <TextWidget
            text={ready.waterDue === 1 ? '  Watered' : `  Watered all ${ready.waterDue}`}
            style={{ fontSize: size(14), fontWeight: '600', color: c.onAccent }}
            maxLines={1}
          />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

/** One thing to do: the task's icon, the plant, then the task, in the task's color. */
function Row({
  row,
  colors: c,
  size,
}: {
  row: WidgetRow;
  colors: Colors;
  size: (base: number) => number;
}) {
  const tone = row.tone === 'water' ? c.water : row.tone === 'fertilize' ? c.fertilize : c.accent;
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.row,
        borderRadius: size(12),
        paddingHorizontal: size(10),
        paddingVertical: size(4),
        marginBottom: size(4),
      }}>
      <SvgWidget
        svg={iconSvg(row.icon, tone, size(16))}
        style={{ width: size(16), height: size(16) }}
      />
      <TextWidget
        text={`  ${row.name}`}
        style={{ fontSize: size(14), fontWeight: '600', color: c.text }}
        maxLines={1}
        truncate="END"
      />
      <TextWidget
        text={`  ${row.task}`}
        style={{ fontSize: size(12), fontWeight: '600', color: tone }}
        maxLines={1}
      />
    </FlexWidget>
  );
}

/** Shown if drawing the real widget fails, so it's never just blank. */
export function FallbackWidget({ look }: { look?: WidgetLook }) {
  const c = colorsFor(look ?? { dark: false, accent: 'leaf' });
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.bg,
        borderRadius: RADIUS,
        padding: 16,
        justifyContent: 'center',
      }}>
      <TextWidget text="Tap to open Plantaloon" style={{ fontSize: 16, color: c.accent }} />
    </FlexWidget>
  );
}
