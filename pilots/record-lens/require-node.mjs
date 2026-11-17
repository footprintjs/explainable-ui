if (Number(process.versions.node.split(".")[0]) < 22) {
  throw new Error(
    "The public recording reader uses Foottrace 2 and must be verified on Node 22 or newer."
  );
}
