/** Offline installed ESM/CJS and strict type proof. Build first. No Foottrace in the consumer. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
  rmSync,
  existsSync,
  cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const readerPackage = process.argv[2];
const repo = fileURLToPath(new URL("../", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "investigation-package-"));
const env = {
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  TMPDIR: tmpdir(),
  CI: "true",
  npm_config_offline: "true",
  npm_config_cache: join(scratch, "npm-cache"),
  npm_config_userconfig: join(scratch, "empty-npmrc"),
  ...(process.env.NODE_OPTIONS ? { NODE_OPTIONS: process.env.NODE_OPTIONS } : {}),
};
function run(command, args, cwd = scratch) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8" });
  if (result.status !== 0)
    throw Error(
      `${command} failed (${result.status})\n${result.stdout}\n${result.stderr}`
    );
  return result.stdout;
}
try {
  const npm = join(
    dirname(process.execPath),
    "../lib/node_modules/npm/bin/npm-cli.js"
  );
  const packed = JSON.parse(
    run(
      process.execPath,
      [
        npm,
        "pack",
        "--json",
        "--ignore-scripts",
        "--pack-destination",
        scratch,
      ],
      repo
    )
  );
  const modules = join(scratch, "node_modules");
  const destination = join(modules, "footprint-explainable-ui");
  mkdirSync(destination, { recursive: true });
  run("/usr/bin/tar", [
    "-xzf",
    join(scratch, packed[0].filename),
    "--strip-components=1",
    "-C",
    destination,
  ]);
  const manifest = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  // Keep this consumer separate from the optional native-reader integration.
  // A dev dependency in that integration must not repair public declarations.
  const peerOnly = join(scratch, "peer-only");
  const peerModules = join(peerOnly, "node_modules");
  cpSync(destination, join(peerModules, "footprint-explainable-ui"), {
    recursive: true,
  });
  const declared = [
    ...new Set([
      ...Object.keys(manifest.peerDependencies),
      ...Object.keys(manifest.dependencies),
      "csstype",
    ]),
  ];
  for (const name of declared) {
    mkdirSync(dirname(join(peerModules, name)), { recursive: true });
    symlinkSync(join(repo, "node_modules", name), join(peerModules, name), "dir");
  }
  for (const name of ["react", "react-dom"]) {
    cpSync(join(repo, "node_modules/@types", name), join(peerModules, "@types", name), {
      recursive: true,
    });
  }
  writeFileSync(join(peerOnly, "package.json"), JSON.stringify({ private: true, type: "module" }));
  assert(!existsSync(join(peerModules, "foottrace")));
  const peerSource = `import { InvestigationPanel, GroupedFlowInvestigation, type InvestigationPort } from 'footprint-explainable-ui';
import { GroupedFlowInvestigation as ChartInvestigation, type GroupedFlowInvestigationProps as ChartProps } from 'footprint-explainable-ui/flowchart';
const port: InvestigationPort = { binding:{}, attention:{nodes:[],confidence:'complete',gaps:[]}, explain:nodeId=>({nodeId,attention:[],path:[nodeId],alternatives:[],confidence:'incomplete',gaps:[],impact:{nodes:[],edges:[],confidence:'complete',gaps:[]}}) };
const definition = {nodes:[{id:'one',label:'One'}],edges:[]};
const chartProps: ChartProps = {definition,port};
InvestigationPanel({port});
GroupedFlowInvestigation({definition,port}); ChartInvestigation(chartProps);
`;
  const noReaderTypeModes = [];
  for (const [mode, extension] of [["NodeNext", "mts"], ["NodeNext", "cts"], ["Bundler", "tsx"]]) {
    const file = `consumer.${extension}`;
    writeFileSync(join(peerOnly, file), peerSource);
    const listing = run(process.execPath, [
      join(repo, "node_modules/typescript/bin/tsc"),
      "--strict", "--skipLibCheck", "false", "--noEmit", "--listFiles",
      "--module", mode === "Bundler" ? "ESNext" : "NodeNext",
      "--moduleResolution", mode, "--target", "ES2020", "--types", "react", file,
    ], peerOnly);
    assert(!listing.includes("/node_modules/foottrace/"), "reader types must not supply UI declarations");
    assert(!listing.includes(join(repo, "src")), "packed checks must not import UI source");
    noReaderTypeModes.push(`${mode} ${extension}`);
  }
  for (const door of ["index", "flowchart"]) for (const extension of ["ts", "cts"]) {
    const declaration = readFileSync(join(destination, `dist/${door}.d.${extension}`), "utf8");
    assert(!/(?:from\s*|import\s*\()\s*['"](?:foottrace(?:\/|['"])|\.\/lib\/cause)/.test(declaration), `${door} public types must be closed`);
  }
  const noReaderRuntime = [];
  for (const extension of ["mjs", "cjs"]) {
    const imports = extension === "mjs"
      ? `import assert from 'node:assert/strict';import{createRequire}from'node:module';import React from'react';import{renderToStaticMarkup}from'react-dom/server';import*as root from'footprint-explainable-ui';import*as chart from'footprint-explainable-ui/flowchart';const require=createRequire(import.meta.url);`
      : `const assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),root=require('footprint-explainable-ui'),chart=require('footprint-explainable-ui/flowchart');`;
    const file = `runtime.${extension}`;
    writeFileSync(join(peerOnly, file), `${imports}
assert.throws(()=>require.resolve('foottrace/cause'),{code:'MODULE_NOT_FOUND'});
for(const api of [root,chart]){
  assert.match(renderToStaticMarkup(React.createElement(api.GroupedFlowInvestigation,{definition:{nodes:[{id:'one',label:'One'}],edges:[]},port:null})),/Fit diagram/);
}
assert.match(renderToStaticMarkup(React.createElement(root.InvestigationPanel,{port:null})),/Investigation/);
console.log(JSON.stringify({format:${JSON.stringify(extension)},doors:['.','./flowchart'],readerAbsent:true}));`);
    noReaderRuntime.push(JSON.parse(run(process.execPath, [file], peerOnly)));
  }
  for (const name of [
    ...Object.keys(manifest.peerDependencies),
    ...Object.keys(manifest.dependencies),
    "vitest",
    "@testing-library/react",
    "@testing-library/jest-dom",
    "jsdom",
    "csstype",
  ]) {
    mkdirSync(dirname(join(modules, name)), { recursive: true });
    symlinkSync(join(repo, "node_modules", name), join(modules, name), "dir");
  }
  mkdirSync(join(modules, "@types"));
  cpSync(
    join(repo, "node_modules/@types/react"),
    join(modules, "@types/react"),
    { recursive: true }
  );
  assert(!existsSync(join(modules, "foottrace")));
  if (readerPackage) {
    mkdirSync(join(modules, "foottrace"));
    run("/usr/bin/tar", [
      "-xzf",
      readerPackage,
      "--strip-components=1",
      "-C",
      join(modules, "foottrace"),
    ]);
  }
  for (const extension of ["ts", "cts"]) {
    const declaration = readFileSync(
      join(destination, `dist/index.d.${extension}`),
      "utf8"
    );
    assert(
      !/from ['"](?:foottrace|\.\/lib\/cause)/.test(declaration),
      "canonical types must be closed in the packed declaration"
    );
  }
  writeFileSync(
    join(scratch, "package.json"),
    JSON.stringify({ private: true, type: "module" })
  );
  const candidateGraph = `const graph = {
    parents: () => ({edges:[],complete:true}),
    children: (id: string) => ({edges:id === 'visit:2' ? [{nodeId:'after:2',kind:'data' as const,attribution:'recorded-read' as const,evidence:['proof:read:1']}] : [],complete:true}),
    attention: (id: string) => id === 'visit:2' ? [{kind:'error',reason:'ERROR_RECORDED' as const,evidence:['proof:error']}] : [],
    gaps: () => [],
  };`;
  const extraTypes = readerPackage
    ? `import {explain, type CauseGraph} from 'foottrace/cause';
${candidateGraph}
const canonicalGraph: CauseGraph = graph;
const futurePort: InvestigationPort = {...port, explain:(id, context)=>explain(canonicalGraph,id,{signal:context.signal})};
InvestigationPanel({port:futurePort});`
    : "";
  const typeSource = `import { InvestigationPanel, type InvestigationPort, type InvestigationResult } from 'footprint-explainable-ui';
const result: InvestigationResult = { nodeId:'visit:2', attention:[], path:['visit:2'], alternatives:[], rootCause:'visit:2', confidence:'complete', gaps:[], impact:{nodes:[],confidence:'complete',gaps:[]} };
const port: InvestigationPort = { binding:{}, attention:{nodes:[],confidence:'complete',gaps:[]}, explain:()=>result };
InvestigationPanel({port}); InvestigationPanel({port:null});
${extraTypes}
`;
  writeFileSync(join(scratch, "consumer.mts"), typeSource);
  writeFileSync(join(scratch, "consumer.cts"), typeSource);
  run(process.execPath, [
    join(repo, "node_modules/typescript/bin/tsc"),
    "--strict",
    "--noEmit",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--target",
    "ES2020",
    "--types",
    "react",
    "consumer.mts",
    "consumer.cts",
  ]);
  mkdirSync(join(scratch, "test"));
  cpSync(join(repo, "test/setup.ts"), join(scratch, "test/setup.ts"));
  for (const [format, extension] of [
    ["esm", "js"],
    ["cjs", "cjs"],
  ]) {
    writeFileSync(
      join(scratch, `test/${format}.test.tsx`),
      `/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
${
  readerPackage
    ? "import {explain as canonicalExplain} from 'foottrace/cause';"
    : ""
}
import { InvestigationPanel } from ${JSON.stringify(
        join(destination, `dist/index.${extension}`)
      )};
it('uses installed ${format} on demand with future metadata', async () => {
const result = {nodeId:'visit:2',attention:[],rootCause:'visit:2',path:['visit:2'],alternatives:[],confidence:'complete',gaps:[],impact:{nodes:['after:2'],edges:[{from:'visit:2',to:'after:2',kind:'data',attribution:'recorded-read',evidence:[]}],confidence:'complete',gaps:[]}};
${
  readerPackage
    ? candidateGraph +
      "\nconst actual = await canonicalExplain(graph,'visit:2'); expect(actual.impact.edges[0].attribution).toBe('recorded-read');"
    : ""
}
const explain = vi.fn(async()=>${
        readerPackage ? "actual" : "result"
      }); const port={binding:{},attention:{nodes:[{nodeId:'visit:2',attention:[]}],confidence:'complete',gaps:[]},explain};
render(<InvestigationPanel port={port}/>);expect(explain).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Investigate item 1'}));await screen.findByText('Supported root cause');expect(explain).toHaveBeenCalledTimes(1);expect(explain.mock.calls[0][0]).toBe('visit:2');expect(screen.queryByText('after:2')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Show affected items'}));expect(screen.getByText('after:2')).toBeTruthy();
});
`
    );
  }
  // Replay the same concurrent/commit and server-render regressions against
  // both real installed public doors, without source imports or Foottrace.
  for (const [format, extension] of [
    ["esm", "js"],
    ["cjs", "cjs"],
  ]) {
    for (const [name, sourcePath] of [
      ["lifecycle", "test/component/InvestigationPanelLifecycle.test.tsx"],
      ["focus", "test/component/InvestigationPanelFocus.test.tsx"],
      ["ssr", "test/unit/InvestigationPanelSSR.test.tsx"],
    ]) {
      const consumer = readFileSync(join(repo, sourcePath), "utf8").replace(
        /(["'])\.\.\/\.\.\/src\/components\/InvestigationPanel\/(?:InvestigationPanel|types)\1/g,
        JSON.stringify(join(destination, `dist/index.${extension}`))
      );
      assert(!consumer.includes("../../src/"));
      writeFileSync(join(scratch, `test/${format}-${name}.test.tsx`), consumer);
    }
  }
  writeFileSync(
    join(scratch, "vitest.config.mjs"),
    `export default {test:{include:['test/*.test.tsx'],setupFiles:['test/setup.ts'],maxWorkers:1,fileParallelism:false}};\n`
  );
  console.log(
    run(process.execPath, [
      join(repo, "node_modules/vitest/vitest.mjs"),
      "run",
      "--config",
      join(scratch, "vitest.config.mjs"),
    ])
  );
  console.log(
    JSON.stringify({
      offline: true,
      packed: packed[0].integrity,
      runtime: process.version,
      strictTypes: ["NodeNext ESM", "NodeNext CJS"],
      noReaderTypeModes,
      noReaderRuntime,
      publicDoors: [".", "./flowchart"],
      peerOnlyDependencies: declared,
      undeclaredFoottraceDependency: false,
      candidateReader: readerPackage
        ? createHash("sha256").update(readFileSync(readerPackage)).digest("hex")
        : null,
      formats: ["esm", "cjs"],
    })
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
