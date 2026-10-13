import { Image } from 'expo-image';
import { View } from 'react-native';

import { getGroup } from '@/catalog';
import { Icon } from '@/components/icons/icon';
import type { Photo } from '@/db/types';
import { photoUri } from '@/lib/photos';
import { useTheme } from '@/theme/theme-provider';

/** A plant's photo, or its care group's icon on a soft tint when there's no photo yet. */
export function PlantAvatar({
  photo,
  groupId,
  size,
  radius,
}: {
  photo: Photo | null | undefined;
  groupId: string;
  size: number;
  /** Defaults to a circle. */
  radius?: number;
}) {
  const theme = useTheme();
  const borderRadius = radius ?? size / 2;
  if (photo) {
    return (
      <Image
        source={{ uri: photoUri(photo.file) }}
        style={{ width: size, height: size, borderRadius, backgroundColor: theme.element }}
        contentFit="cover"
        transition={180}
        accessible={false}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: theme.tintSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={getGroup(groupId).icon} size={Math.round(size * 0.5)} color={theme.tint} />
    </View>
  );
}
