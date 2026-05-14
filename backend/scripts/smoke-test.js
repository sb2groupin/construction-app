const assert = require("assert");

const { app } = require("../server");
const { toLocalDateString } = require("../utils/date.utils");
const { getDistance, isWithinGeoFence } = require("../utils/geo.utils");
const { sendSuccess } = require("../utils/response.utils");

assert.ok(app, "Express app should export for smoke tests");
assert.strictEqual(toLocalDateString(new Date(2026, 4, 14)), "2026-05-14");
assert.strictEqual(Math.round(getDistance(0, 0, 0, 0)), 0);
assert.strictEqual(isWithinGeoFence(26.9124, 75.7873, 26.9124, 75.7873, 10).isValid, true);
assert.strictEqual(typeof sendSuccess, "function");

const routePaths = app._router.stack
  .filter((layer) => layer.route)
  .map((layer) => layer.route.path);

assert.ok(routePaths.includes("/api/health"), "health route should be registered");

console.log("Backend smoke tests passed.");
