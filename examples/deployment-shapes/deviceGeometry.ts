/** Consumer-owned geometry; use these dimensions in the host's node-size resolver. */
export type InfrastructureKind = 'server' | 'router' | 'switch' | 'card';
export interface DeviceRect { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
export interface DevicePort { readonly x: number; readonly y: number; readonly side: 'top' | 'bottom' | 'left' | 'right' }
export interface DeviceGeometry {
  readonly kind: InfrastructureKind;
  readonly revision: string;
  readonly width: number;
  readonly height: number;
  readonly paint: DeviceRect;
  readonly body: DeviceRect;
  readonly content: DeviceRect;
  readonly footer: DeviceRect;
  readonly ports: Readonly<Record<'target' | 'source' | 'loop-source' | 'loop-target', DevicePort>>;
}

function geometry(kind: InfrastructureKind, height: number, bodyHeight: number): DeviceGeometry {
  const width = 224;
  return Object.freeze({ kind, revision: `${kind}:1`, width, height,
    paint: Object.freeze({ x: 4, y: 4, width: width - 8, height: height - 8 }),
    body: Object.freeze({ x: 24, y: 28, width: 176, height: bodyHeight }),
    content: Object.freeze({ x: 12, y: 28 + bodyHeight + 6, width: 200, height: 46 }),
    footer: Object.freeze({ x: 8, y: height - 26, width: width - 16, height: 18 }),
    ports: Object.freeze({
      target: Object.freeze({ x: width / 2, y: 0, side: 'top' }),
      source: Object.freeze({ x: width / 2, y: height, side: 'bottom' }),
      'loop-source': Object.freeze({ x: width, y: height / 2, side: 'right' }),
      'loop-target': Object.freeze({ x: 0, y: height / 2, side: 'left' }),
    }),
  });
}
const geometries = Object.freeze({
  server: geometry('server', 176, 68),
  router: geometry('router', 164, 56),
  switch: geometry('switch', 156, 48),
  card: geometry('card', 144, 36),
});

/** An explicit stage-ID mapping supplies the kind. Labels never classify infrastructure. */
export function getDeviceGeometry(kind: unknown): DeviceGeometry {
  return kind === 'server' || kind === 'router' || kind === 'switch' ? geometries[kind] : geometries.card;
}
