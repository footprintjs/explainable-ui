if (Number(process.versions.node.split(".")[0]) < 22) {
  throw new Error(
    "The record package and its verification use Foottrace and require Node 22 or newer."
  );
}
