import ts from "typescript";
import { resolve } from "node:path";

/** Test-only inventory of the actual exported names, including erased types. */
export function exportSurface(entries: Readonly<Record<string, string>>) {
  const program = ts.createProgram(
    Object.values(entries).map((path) => resolve(path)),
    {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      noEmit: true,
      skipLibCheck: true,
    }
  );
  const checker = program.getTypeChecker();
  return Object.fromEntries(
    Object.entries(entries).map(([door, path]) => {
      const source = program.getSourceFile(resolve(path));
      if (!source) throw new Error(`Missing public entry ${path}`);
      const module = checker.getSymbolAtLocation(source);
      if (!module) throw new Error(`No exports in ${path}`);
      const names = checker
        .getExportsOfModule(module)
        .map((symbol) => {
          const target =
            symbol.flags & ts.SymbolFlags.Alias
              ? checker.getAliasedSymbol(symbol)
              : symbol;
          const typeOnly = symbol.declarations?.some(
            (declaration) =>
              ts.isExportSpecifier(declaration) &&
              (declaration.isTypeOnly || declaration.parent.parent.isTypeOnly)
          );
          return {
            name: symbol.name,
            kind:
              !typeOnly && target.flags & ts.SymbolFlags.Value
                ? "value"
                : "type",
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return [door, names];
    })
  );
}
