/** Packages available to a root/flowchart consumer without the optional record reader. */
export function graphConsumerPackages(manifest) {
  return [
    ...Object.keys(manifest.peerDependencies).filter(name => name !== 'foottrace'),
    ...Object.keys(manifest.dependencies ?? {}),
  ];
}
