import assert from "node:assert/strict";
import test from "node:test";

import { fontLibrary } from "../src/data/generated-font-library.ts";
import { getMockupText, resolveMockupFaces } from "../src/lib/mockup.ts";

function face(id, weight, style = "normal") {
  return {
    id,
    name: id,
    fontFamily: `test-${id}`,
    weight: String(weight),
    style,
  };
}

function family(faces, overrides = {}) {
  return {
    id: "test",
    family: "Test Family",
    designer: "",
    designers: [],
    foundry: "",
    license: "",
    links: {},
    faces,
    previewFamily: faces[0].fontFamily,
    ...overrides,
  };
}

test("automatic print mockups pair display headlines with text faces", () => {
  const regular = face("Regular400", 400);
  const semibold = face("SemiBold600", 600);
  const displayRegular = face("DisplayRegular400", 400);
  const displayMedium = face("DisplayMedium500", 500);
  const displaySemibold = face("DisplaySemiBold600", 600);
  const displayBold = face("DisplayBold700", 700);
  const boldItalic = face("Bold700Italic", 700, "italic");
  const font = family([
    regular,
    semibold,
    displayRegular,
    displayMedium,
    displaySemibold,
    displayBold,
    boldItalic,
  ]);

  for (const [scene, headline] of [
    ["programme", displaySemibold],
    ["placard", displaySemibold],
    ["poster", displayBold],
    ["book", displayMedium],
    ["study", displaySemibold],
    ["artprint", displayBold],
    ["broadside", displayMedium],
    ["reading", displaySemibold],
  ]) {
    const resolved = resolveMockupFaces(font, scene);
    assert.equal(resolved.headline, headline);
    assert.equal(resolved.body, regular);
  }
});

test("automatic selection uses the nearest available cut and prefers the heavier tie", () => {
  const light = face("Book350", 350);
  const regular = face("Regular450", 450);
  const medium = face("Medium550", 550);
  const font = family([light, regular, medium]);
  assert.deepEqual(resolveMockupFaces(font, "book"), {
    headline: medium,
    body: regular,
  });
});

test("single-face and italic-only families retain their supplied styles", () => {
  const single = face("Regular400Italic", 400, "italic");
  assert.deepEqual(resolveMockupFaces(family([single]), "poster"), {
    headline: single,
    body: single,
  });

  const bold = face("Bold700Italic", 700, "italic");
  const font = family([bold, single], { previewFamily: single.fontFamily });
  assert.deepEqual(resolveMockupFaces(font, "programme"), {
    headline: single,
    body: single,
  });
});

test("every registered font supplies real faces for every mockup scene", () => {
  for (const font of fontLibrary) {
    for (const scene of [
      "programme",
      "placard",
      "poster",
      "book",
      "study",
      "artprint",
      "broadside",
      "reading",
    ]) {
      const { headline, body } = resolveMockupFaces(font, scene);
      assert.ok(
        font.faces.includes(headline),
        `${font.family}: ${scene} headline`,
      );
      assert.ok(font.faces.includes(body), `${font.family}: ${scene} body`);
    }
  }
});

test("mockup copy uses sanitized fallback text without introducing unsupported glyphs", () => {
  const font = fontLibrary.find((font) => font.id === "runicon-cypher");
  assert.ok(font);
  assert.equal(
    getMockupText(font, "HELLO, 123 WORLD!", "Quiet worlds."),
    "hllo*  world*",
  );
  assert.equal(getMockupText(font, "EEE 123", "Quiet worlds."), "quit worlds*");
  assert.equal(getMockupText(font, "", "Quiet worlds."), "quit worlds*");
  assert.equal(getMockupText(font, "EEE 123", "EEE 456"), "");
  assert.equal(getMockupText(font, "", ""), "");
});

test("restricted-font copy preserves line breaks without filling blank lines with a family name", () => {
  const font = fontLibrary.find((font) => font.id === "runicon-cypher");
  assert.ok(font);
  assert.equal(getMockupText(font, "HELLO\nWORLD", ""), "hllo\nworld");
  assert.equal(
    getMockupText(font, "HELLO\r\n  \r\nWORLD!", ""),
    "hllo\n\nworld*",
  );
  assert.equal(getMockupText(font, "HELLO\nEEE\nWORLD", ""), "hllo\n\nworld");
  assert.equal(
    getMockupText(font, "EEE\n\n123", "QUIET\nWORLDS"),
    "quit\nworlds",
  );
  assert.equal(getMockupText(font, "EEE\n\n123", "EEE\n123"), "");
});

test("ordinary mockup copy trims surrounding whitespace and uses scene defaults when blank", () => {
  const font = family([face("Regular400", 400)]);
  assert.equal(
    getMockupText(font, "  Custom headline  ", "Scene headline"),
    "Custom headline",
  );
  assert.equal(
    getMockupText(font, "  \n ", "  Scene headline  "),
    "Scene headline",
  );
});
