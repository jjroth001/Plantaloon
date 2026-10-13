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

/** A Phosphor duotone icon (MIT, phosphoricons.com) in any color. */
export function Icon({ name, size = 24, color, duotone = true }: IconProps) {
  const { duo, solid } = PHOSPHOR[name] ?? PHOSPHOR.plant;
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" accessible={false}>
      {duotone && duo.map((d) => <Path key={d} d={d} fill={color} opacity={0.2} />)}
      {solid.map((d) => (
        <Path key={d} d={d} fill={color} />
      ))}
    </Svg>
  );
}
