if (Number(process.versions.node.split(".")[0]) < 22) {
  throw new Error(
    "The non-shipping record pilot uses Foottrace and must be verified on Node 22 or newer."
  );
}
