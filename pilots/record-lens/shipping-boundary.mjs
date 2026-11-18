/** Reject eager peer imports. Only the two optional, failure-handled Backtrack imports may cross this boundary. */
import assert from "node:assert/strict";
import ts from "typescript";
export function assertNoPilotSource(source, fileName = "shipped.js") {
  assert(
    !/src\/record(?:[/.]|$)|record-lens/i.test(source),
    `Normal shipped output contains pilot source: ${fileName}`
  );
}
export function assertNoFoottraceRuntime(source, fileName = "shipped.js") {
  const ast = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  function check(specifier) {
    if (!specifier || !ts.isStringLiteralLike(specifier))
      throw new Error(`Uncheckable runtime module reference: ${fileName}`);
    const call = specifier.parent;
    const catcher = call.parent;
    if (["foottrace", "foottrace/cause"].includes(specifier.text) && ts.isCallExpression(call) &&
        call.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isPropertyAccessExpression(catcher) &&
        catcher.expression === call && catcher.name.text === "catch" && ts.isCallExpression(catcher.parent) &&
        catcher.parent.expression === catcher && catcher.parent.arguments.length === 1 &&
        ts.isArrowFunction(catcher.parent.arguments[0])) return;
    assert(
      !/^foottrace(?:\/|$)/.test(specifier.text),
      `Foottrace runtime dependency in ${fileName}`
    );
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly)
      check(node.moduleSpecifier);
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      !node.isTypeOnly
    )
      check(node.moduleSpecifier);
    if (
      ts.isImportEqualsDeclaration(node) &&
      !node.isTypeOnly &&
      ts.isExternalModuleReference(node.moduleReference)
    )
      check(node.moduleReference.expression);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require") ||
        (ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === "require"))
    )
      check(node.arguments[0]);
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
