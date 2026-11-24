# /// script
# requires-python = ">=3.10"
# dependencies = ["psd-tools[composite]==1.24.0", "Pillow==12.3.0"]
# ///
"""Exporter regression checks using small descriptor/raster-bound snapshots.

Run with ``uv run tests/test_mockup_warp_export.py``. The fixtures were read from
MDU049 and MDU088; no source ZIPs, PSD decoding or asset writes are needed.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest
from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("mockup_export", ROOT / "scripts/build-mockup-assets.py")
exporter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(exporter)

# Exact SoLd descriptor values from the supplied column's two print surfaces.
COLUMN = [453.0, 2191.190201729105, 1719.0, 3.7156580211335495,
          -0.03049090439239839, 0.023208676609585015, 0.6603475513428121]
COLUMN_TOP = [179.60382826773775, 360.7826492334352, 1415.5048611766974,
              39.85973857061083, -0.0364019382504128, -0.038828734133773794, 0.9]
CUSTOM_X = [
    4.450370879134026, 753.4572781075132, 1508.5883054396463, 2235.146590116841,
    19.407682897041468, 761.2367531927442, 1499.0530303217888, 2211.696454815442,
    30.574994818240814, 766.4758399674743, 1489.1409574934466, 2226.294177302025,
    17.75805860936153, 762.2327705434001, 1490.4308192635851, 2235.0,
]
CUSTOM_Y = [
    -8.488443609302585, -14.6433723326648, -32.7589830815129, -13.176029509699505,
    1045.05358657104, 1039.5515716483367, 1017.6008291614255, 1030.700109011856,
    2094.0818660660843, 2091.424430111513, 2085.588883081876, 2086.1263303982523,
    3129.7399574293504, 3129.718069293069, 3129.0179517323254, 3129.0,
]


def descriptor(style, **fields):
    return {
        b"warpStyle": SimpleNamespace(enum=style),
        b"warpPerspective": 0,
        b"warpPerspectiveOther": 0,
        b"warpRotate": SimpleNamespace(enum=b"Hrzn"),
        b"uOrder": 4,
        b"vOrder": 4,
        **{key.encode(): value for key, value in fields.items()},
    }


def layer_with(warp):
    config = SimpleNamespace(data={b"warp": warp})
    return SimpleNamespace(
        name="Fixture print",
        tagged_blocks=SimpleNamespace(get_data=lambda key:
            config if key == exporter.Tag.SMART_OBJECT_LAYER_DATA1 else None),
    )


def custom_descriptor():
    return descriptor(
        b"warpCustom",
        bounds={b"Top ": 0, b"Left": 0, b"Btom": 3129, b"Rght": 2235},
        customEnvelopeWarp={b"meshPoints": {b"Hrzn": CUSTOM_X, b"Vrtc": CUSTOM_Y}},
    )


def sample(mesh, u, v):
    """Evaluate the exported cage, independent of the exporter's preset logic."""
    def axis(knots, value):
        index = next((i for i, end in enumerate(knots[1:]) if value <= end), len(knots) - 2)
        t = (value - knots[index]) / (knots[index + 1] - knots[index])
        return index, ((1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3)

    column, xweights = axis(mesh["u"], u)
    row, yweights = axis(mesh["v"], v)
    width = (len(mesh["u"]) - 1) * 3 + 1
    return tuple(sum(
        xweights[x] * yweights[y] * mesh["points"][(row * 3 + y) * width + column * 3 + x][component]
        for y in range(4) for x in range(4)
    ) for component in range(2))


def projected_outline(mesh, rectangle):
    left, top, right, bottom = rectangle
    points = []
    u0, u1 = mesh["u"][0], mesh["u"][-1]
    for i in range(257):
        t = i / 256
        for u, v in ((u0 + t * (u1 - u0), 0), (u0 + t * (u1 - u0), 1), (u0, t), (u1, t)):
            x, y = sample(mesh, u, v)
            points.append((left + x * (right - left), top + y * (bottom - top)))
    return (min(x for x, y in points), min(y for x, y in points),
            max(x for x, y in points), max(y for x, y in points))


class WarpExportTests(unittest.TestCase):
    def test_unwarped_and_missing_descriptors_do_not_create_a_mesh(self):
        self.assertIsNone(exporter.surface_warp(layer_with(descriptor(b"warpNone"))))
        missing = SimpleNamespace(name="Plain", tagged_blocks=SimpleNamespace(get_data=lambda key: None))
        self.assertIsNone(exporter.surface_warp(missing))

    def test_custom_cage_uses_control_hull_not_source_rectangle(self):
        mesh = exporter.surface_warp(layer_with(custom_descriptor()))
        self.assertEqual(mesh["u"], [0, 1])
        self.assertEqual(mesh["v"], [0, 1])
        self.assertEqual(len(mesh["points"]), 16)
        # PSD layer-alpha bounds measured independently, at the exported 1800px size.
        actual = projected_outline(mesh, (563.85, 131.8335, 1192.95, 1023.622))
        raster = (563.85, 134.533, 1192.95, 1023.622)
        for value, reference in zip(actual, raster):
            self.assertAlmostEqual(value, reference, delta=0.6)
        # The first control is inset vertically within a cage that overhangs the source.
        self.assertGreater(mesh["points"][0][1], 0)
        self.assertLess(mesh["points"][0][1], 0.01)

    def test_column_front_omits_back_and_matches_cached_raster(self):
        mesh = exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=COLUMN)))
        self.assertEqual(mesh["u"], [0.02185485, 0.5, 0.97814515])
        self.assertEqual(len(mesh["points"]), 28)
        actual = projected_outline(mesh, (725.4, 335.658, 1090.35, 976.378))
        raster = (725.4, 335.658, 1090.35, 975.928)
        for value, reference in zip(actual, raster):
            self.assertAlmostEqual(value, reference, delta=0.6)
        # The center rises at the top and falls at the bottom: both edges curve.
        self.assertLess(sample(mesh, 0.5, 0)[1], sample(mesh, mesh["u"][0], 0)[1])
        self.assertGreater(sample(mesh, 0.5, 1)[1], sample(mesh, mesh["u"][0], 1)[1])

    def test_column_top_preserves_its_different_ellipse_and_hidden_domain(self):
        mesh = exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=COLUMN_TOP)))
        self.assertEqual(mesh["u"], [0.0086, 0.5, 0.9914])
        actual = projected_outline(mesh, (728.55, 229.0214, 1084.95, 328.009))
        raster = (728.55, 229.021, 1084.95, 329.359)
        for value, reference in zip(actual, raster):
            self.assertAlmostEqual(value, reference, delta=1.5)
        # Unlike the main sheet, the top strip curves upward at both edges.
        self.assertLess(sample(mesh, 0.5, 1)[1], sample(mesh, mesh["u"][0], 1)[1])

    def test_column_center_retains_source_letter_proportions(self):
        for values, placed, plane in ((COLUMN, (364.95, 640.72), (600, 647.1)),
                                     (COLUMN_TOP, (356.4, 98.9876), (600, 98.7))):
            mesh = exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=values)))
            delta = 0.0001
            sx = (sample(mesh, 0.5 + delta, 0.5)[0] - sample(mesh, 0.5 - delta, 0.5)[0]) / (2 * delta)
            sy = (sample(mesh, 0.5, 0.5 + delta)[1] - sample(mesh, 0.5, 0.5 - delta)[1]) / (2 * delta)
            relative_scale = (sx * placed[0] / plane[0]) / (sy * placed[1] / plane[1])
            self.assertAlmostEqual(relative_scale, 1, delta=0.1)

    def test_preset_interpolation_is_continuous_and_clamps_amount(self):
        low = COLUMN.copy()
        high = COLUMN.copy()
        low[-1], high[-1] = -2, 3
        self.assertEqual(exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=low)))["u"][0], 0.166169)
        self.assertEqual(exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=high)))["u"][0], 0.005686)
        before, after = COLUMN.copy(), COLUMN.copy()
        before[-1], after[-1] = 0.65 - 1e-7, 0.65 + 1e-7
        a = exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=before)))
        b = exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=after)))
        for p, q in zip(a["points"], b["points"]):
            for x, y in zip(p, q):
                self.assertAlmostEqual(x, y, delta=1e-6)

    def test_unsupported_warps_fail_instead_of_becoming_flat(self):
        variants = [descriptor(b"warpArc"), custom_descriptor(),
                    descriptor(b"warpCylinder", warpValues=COLUMN), custom_descriptor()]
        variants[1][b"warpPerspective"] = 10
        variants[2][b"warpRotate"] = SimpleNamespace(enum=b"Vrtc")
        variants[3][b"customEnvelopeWarp"][b"meshPoints"] = {b"Hrzn": [0], b"Vrtc": [0]}
        for variant in variants:
            with self.subTest(style=variant[b"warpStyle"].enum), self.assertRaises(ValueError):
                exporter.surface_warp(layer_with(variant))

    def test_invalid_controls_and_cylinder_extents_are_rejected(self):
        invalid_points = [[(0, 0), (float("nan"), 1)], [(0, 0), (0, 1)]]
        for points in invalid_points:
            with self.assertRaises(ValueError):
                exporter.normalized_warp([0, 1], [0, 1], points)
        for values in (COLUMN[:6], [0, 2, 0, 1, 0, 0, 0.5], [0, 2, 1, 3, 0, 0, 0.5], [0, 2, 1, 0, float("inf"), 0, 0.5]):
            with self.subTest(values=values), self.assertRaises(ValueError):
                exporter.surface_warp(layer_with(descriptor(b"warpCylinder", warpValues=values)))


class ArchiveSceneTests(unittest.TestCase):
    def scenes(self, names):
        return exporter.archive_documents(SimpleNamespace(namelist=lambda: names), Path("MD123_Pack.zip"))

    def test_single_scene_keeps_existing_id(self):
        self.assertEqual(self.scenes(["Pack/Scene_1.psd", "Pack/Preview.jpg"]),
                         [("md123", "Pack/Scene_1.psd")])

    def test_all_angles_keep_filename_numbers_independent_of_zip_order(self):
        self.assertEqual(self.scenes(["Pack/Scene_4.psd", "Pack/Scene_1.psd",
                                      "__MACOSX/Pack/._Scene_1.psd"]),
                         [("md123-1", "Pack/Scene_1.psd"), ("md123-4", "Pack/Scene_4.psd")])

    def test_ambiguous_document_ids_fail_instead_of_overwriting_an_angle(self):
        for names in (["One_1.psd", "Other_1.psd"], ["One.psd", "Other.psd"], ["Preview.jpg"]):
            with self.assertRaises(ValueError):
                self.scenes(names)


class PaperMaskExportTests(unittest.TestCase):
    def make_sheet(self):
        psd = SimpleNamespace(size=(12, 12))
        contour = Image.new("L", (8, 8), 255)
        # A torn corner belongs to the paper outline, unlike clear sample margins.
        contour.putpixel((0, 7), 0)
        contour.putpixel((1, 7), 0)
        mask = SimpleNamespace(
            disabled=False, left=2, top=2, right=10, bottom=10,
            background_color=0, has_real=lambda: False,
            topil=lambda **kwargs: contour,
        )
        group = SimpleNamespace(mask=mask, parent=psd)
        layer = SimpleNamespace(
            name="Design", size=(4, 4), left=4, top=4, mask=None, parent=group,
            topil=lambda *args, **kwargs: Image.new("L", (4, 4), 255),
        )
        return psd, layer

    def test_full_paper_ignores_sample_margins_but_keeps_the_torn_corner(self):
        psd, layer = self.make_sheet()
        inset = exporter.page_mask(psd, layer)
        full = exporter.page_mask(psd, layer, use_artwork_alpha=False)
        self.assertEqual(inset.getbbox(), (4, 4, 8, 8))
        self.assertEqual(full.getbbox(), (2, 2, 10, 10))
        self.assertEqual(full.getpixel((2, 2)), 255)
        self.assertEqual(full.getpixel((1, 2)), 0)
        self.assertEqual(full.getpixel((2, 9)), 0)
        self.assertEqual(full.getpixel((3, 9)), 0)
        self.assertEqual(full.getpixel((9, 9)), 255)
        self.assertEqual(exporter.paper_mask_surface(layer, (2, 3)),
                         [[4, 6], [20, 6], [20, 30], [4, 30]])

    def test_full_paper_still_respects_foreground_occlusion(self):
        psd, layer = self.make_sheet()
        foreground = Image.new("L", psd.size, 255)
        foreground.putpixel((6, 6), 0)
        mask = SimpleNamespace(
            disabled=False, left=0, top=0, background_color=255,
            has_real=lambda: False, topil=lambda **kwargs: foreground,
        )
        layer.parent.parent = SimpleNamespace(mask=mask, parent=psd)
        full = exporter.page_mask(psd, layer, use_artwork_alpha=False)
        self.assertEqual(full.getpixel((6, 6)), 0)
        self.assertEqual(full.getpixel((5, 6)), 255)

    def test_full_bleed_requires_a_real_paper_mask(self):
        psd, layer = self.make_sheet()
        layer.parent.mask = None
        with self.assertRaisesRegex(ValueError, "enclosing paper mask"):
            exporter.page_mask(psd, layer, use_artwork_alpha=False)


if __name__ == "__main__":
    unittest.main()
