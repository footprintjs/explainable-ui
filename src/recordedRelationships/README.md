# Recorded relationship attribution

This internal display contract owns the accepted attribution values and their
full labels and compact captions. The investigation boundary and the standalone
grouped-diagram boundary use the same owner, without importing one another.

`recorded-write` is a data edge: a partial write retained an earlier recorded
value. Its caption is **Kept**, separate from **Read**. It does not prove which
expression computed an output, workflow order, a provider fault or an external
effect. This module does not discover or authenticate evidence.

The existing endpoint, scope, proof, uncertainty, getter and work limits remain
with each admission boundary. Legacy attribution/kind combinations are unchanged;
unknown values and control-kind retained writes are refused.

`retainedWrite.test.ts` exercises admission and projection behavior across both
boundaries. Renderer and grouped interaction checks remain in `test/unit`.
