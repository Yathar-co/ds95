/* global loadPyodide */
const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v0.29.4/full/";
let runtimePromise;

function runtime() {
  if (!runtimePromise) {
    importScripts(`${PYODIDE_BASE}pyodide.js`);
    runtimePromise = loadPyodide({ indexURL: PYODIDE_BASE });
  }
  return runtimePromise;
}

self.onmessage = async ({ data }) => {
  const { id, code } = data;
  const stdout = [];
  const stderr = [];
  try {
    const pyodide = await runtime();
    pyodide.setStdout({ batched: (line) => stdout.push(line) });
    pyodide.setStderr({ batched: (line) => stderr.push(line) });
    await pyodide.loadPackagesFromImports(code);
    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined && result !== null && String(result) !== "None") stdout.push(String(result));
    if (result && typeof result.destroy === "function") result.destroy();
    self.postMessage({ id, ok: true, text: [...stdout, ...stderr].join("\n") || "Code completed with no output." });
  } catch (error) {
    self.postMessage({ id, ok: false, text: String(error?.message || error) });
  }
};
