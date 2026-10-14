import { LightSensor } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { smoothLux } from '@/lib/light';

export type SensorState = 'checking' | 'ready' | 'missing';

/** Live, smoothed light readings (lux) while `active`; the sensor is off otherwise. */
export function useLightSensor(active: boolean): { state: SensorState; lux: number | null } {
  const [state, setState] = useState<SensorState>('checking');
  const [lux, setLux] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let subscription: { remove: () => void } | null = null;
    let live = true;
    (async () => {
      const available = Platform.OS === 'android' && (await LightSensor.isAvailableAsync());
      if (!live) return;
      if (!available) {
        setState('missing');
        return;
      }
      setState('ready');
      LightSensor.setUpdateInterval(400);
      subscription = LightSensor.addListener(({ illuminance }) => {
        setLux((previous) => smoothLux(previous, illuminance));
      });
    })().catch(() => setState('missing'));
    return () => {
      live = false;
      subscription?.remove();
      setLux(null);
    };
  }, [active]);

  return { state, lux };
}
