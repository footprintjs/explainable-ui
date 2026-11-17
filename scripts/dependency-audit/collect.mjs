import { collectEvidence } from './evidence.mjs';

try {
  const report = await collectEvidence({ projectDir: process.cwd(), npmCli: process.env.npm_execpath });
  console.log(`${report.collectionStatus}: ${report.message}`);
  if (report.collectionStatus !== 'COLLECTED') {
    console.error(`Dependency audit evidence failed: ${report.failureCode}`);
    process.exitCode = 1;
  } else if (!report.clean) {
    const counts = `full=${report.audits.full.counts.total}, production=${report.audits.production.counts.total}`;
    console.log(`FINDINGS_UNRESOLVED (${counts}). Audit is not clean. See dependency-security/report.json.`);
    if (process.env.GITHUB_ACTIONS === 'true') console.log(`::warning title=Unresolved dependency findings::Audit is not clean (${counts}). See the saved dependency-security evidence.`);
  }
} catch {
  console.error('Dependency audit evidence failed: output directory must be fresh and writable.');
  process.exitCode = 1;
}
