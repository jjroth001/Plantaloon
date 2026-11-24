import Svg, { Path } from 'react-native-svg';

import { PHOSPHOR, type PhosphorName } from './phosphor-paths';

export type IconName = PhosphorName;

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  /** The soft background shape; off for tiny inline icons where it reads as smudge. */
  duotone?: boolean;
};

/**
 * Icons whose soft shape is just a square frame, not part of the drawing: on a round button
 * it shows as a pale box behind the mark, so they're always drawn plain.
 */
const PLAIN: ReadonlySet<IconName> = new Set<IconName>(['plus', 'x']);

/** A Phosphor duotone icon (MIT, phosphoricons.com) in any color. */
export function Icon({ name, size = 24, color, duotone = true }: IconProps) {
  const { duo, solid } = PHOSPHOR[name] ?? PHOSPHOR.plant;
  const soft = duotone && !PLAIN.has(name);
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" accessible={false}>
      {soft && duo.map((d) => <Path key={d} d={d} fill={color} opacity={0.2} />)}
      {solid.map((d) => (
        <Path key={d} d={d} fill={color} />
      ))}
    </Svg>
  );
}
