const { ValidationError } = require("./errors");

// tasks: [{ id, depends_on: [id, ...] }] -> returns array of arrays,
// where each inner array can run in parallel (all deps already done).
function topoLayers(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const remaining = new Set(tasks.map((t) => t.id));
  const done = new Set();
  const layers = [];

  while (remaining.size) {
    const ready = [...remaining].filter((id) => {
      const deps = byId.get(id).depends_on || [];
      return deps.every((d) => done.has(d));
    });

    if (ready.length === 0) {
      throw new ValidationError("Task graph has a cycle or an unresolved dependency");
    }

    layers.push(ready);
    ready.forEach((id) => {
      remaining.delete(id);
      done.add(id);
    });
  }
  return layers;
}

module.exports = { topoLayers };
