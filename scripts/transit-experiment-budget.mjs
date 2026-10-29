import { existsSync, readFileSync, readdirSync, openSync, closeSync, unlinkSync } from "node:fs";
import path from "node:path";

export function acquireExperimentLock(directory, day) {
  const file = path.join(directory, `.transit-direct-${day}.lock`);
  const descriptor = openSync(file, "wx");
  return () => { closeSync(descriptor); unlinkSync(file); };
}

export function otherReservedCalls(directory, day, currentStatePath) {
  let used = 0;
  for (const item of readdirSync(directory, {withFileTypes: true})) {
    if (!item.isDirectory() || !item.name.startsWith(`transit-reexperiment-${day}`)) continue;
    const file = path.join(directory, item.name, "state.json");
    if (path.resolve(file) === path.resolve(currentStatePath) || !existsSync(file)) continue;
    const state = JSON.parse(readFileSync(file, "utf8"));
    if (state.dateKst === day) used += state.reservedCalls;
  }
  return used;
}
