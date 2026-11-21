interface ReferenceOmission {
  readonly omittedReferences?: number;
}

export function omittedReferenceCount(entries: readonly ReferenceOmission[] = []): number {
  return entries.reduce((count, entry) => count + (entry.omittedReferences ?? 0), 0);
}

export function ReferenceOmissionNotice({ count, scope }: { readonly count: number; readonly scope?: string }) {
  return count > 0 ? <p>
    {scope !== undefined && <>{scope}{' · '}</>}
    {`${count} more ${count === 1 ? 'reference' : 'references'} not shown`}
  </p> : null;
}

export function RelationshipOmissionNotices({ backward, impact }: {
  readonly backward?: readonly ReferenceOmission[];
  readonly impact?: readonly ReferenceOmission[];
}) {
  return <>
    <ReferenceOmissionNotice count={omittedReferenceCount(backward)} scope="Backward relationships" />
    <ReferenceOmissionNotice count={omittedReferenceCount(impact)} scope="Affected-item relationships" />
  </>;
}
