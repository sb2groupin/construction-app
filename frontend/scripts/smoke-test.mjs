import assert from "node:assert/strict";
import { toLocalDateString, toLocalMonthString } from "../src/utils/date.utils.js";

assert.equal(toLocalDateString(new Date(2026, 4, 14)), "2026-05-14");
assert.equal(toLocalMonthString(new Date(2026, 4, 14)), "2026-05");

console.log("Frontend smoke tests passed.");
