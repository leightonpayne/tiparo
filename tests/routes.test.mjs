import assert from "node:assert/strict";
import test from "node:test";

import { getFontIdFromPath } from "../src/lib/routes.ts";

test("font routes decode valid IDs and ignore unrelated routes", () => {
  assert.equal(getFontIdFromPath("/fonts/inter"), "inter");
  assert.equal(getFontIdFromPath("/fonts/Caf%C3%A9%20Sans"), "Café Sans");
  assert.equal(getFontIdFromPath("/"), null);
  assert.equal(getFontIdFromPath("/fonts/"), null);
  assert.equal(getFontIdFromPath("/fonts/inter/extra"), null);
});

test("malformed encoded font IDs fall back to the library", () => {
  for (const id of ["%", "%E0%A4%A", "%FF", "inter%2"]) {
    assert.equal(getFontIdFromPath(`/fonts/${id}`), null);
  }
});
