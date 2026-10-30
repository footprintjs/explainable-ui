# A problem, traced back

This offline example uses synthetic saved commits and Foottrace's actual
`createRecordGraph` and `explain` functions. It does not run an application,
contact a provider, or choose a cause in display code.

```sh
npx vite --config examples/grouped-investigation/vite.config.ts
```

Open the printed loopback address, then click **No shipping option**. The
grouped investigation view asks its bound host port for one explanation,
opens relevant groups, and shows the supported cause and the available impact.
Switching cause and impact reuses that result; the analysis-call count remains
unchanged. The Payment group is unrelated to the failed item's recorded inputs.

Use the recording selector to compare a complete recording, missing capture,
and two independent candidate causes. Missing evidence stays unknown; tied
candidates are not promoted to an answer. A step can finish successfully but
return an unusable result: the Shipping rates issue in this example is a
recorded business-rule finding, not proof of a carrier's internal fault.

## Structure and evidence have separate jobs

The presentation definition and its observed branches are supplied explicitly.
The groups are app-approved presentation groups; they do not assert a native
subflow boundary or a group outcome. Every executed item's diagram ID comes
from `graph.nodeId`; labels never select an execution. The two unexecuted
definition items have no admitted execution to investigate, and the host
refuses those requests.

The host requests `includeBackward: true`. Connected dependency overlays require
the optional canonical `backward` result from the corresponding Foottrace
feature. If an installed reader does not provide those relationships, the view
must state that they are unavailable and must not turn design arrows into proof.
The ordinary development reader remains pinned; candidate-reader acceptance is
performed in an isolated packed consumer before the feature is released.

Backward links point from the selected dependent toward earlier recorded
evidence. Impact links point from a producer toward its consumers. Their kind,
attribution and evidence references remain separate from an execution branch's
observed/not-taken state. A recorded read does not prove that a particular output
was derived from it.

```sh
npx vite build --config examples/grouped-investigation/vite.config.ts
```

The static build goes to `grouped-investigation-example-dist/`. No narration,
model calls, live service access, application adoption or deployment is included.
