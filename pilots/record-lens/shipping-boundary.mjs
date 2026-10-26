/** Inspect executable module references, ignoring comments and erased type imports. */
import assert from "node:assert/strict";
import ts from "typescript";
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
