# /// script
# requires-python = ">=3.10"
# dependencies = ["psd-tools[composite]==1.24.0", "Pillow==12.3.0"]
# ///
"""Export the supplied PSD mockups as blank, locally served preview assets.

Run with ``uv run scripts/build-mockup-assets.py``. The large source archives
stay in content/mockups; only flattened WebP photographs, alpha masks and
placement metadata are written to the application. Optional archive prefixes
let an individual asset be rebuilt without reprocessing the collection.
"""

from __future__ import annotations

import argparse
import gc
import io
import json
import math
from pathlib import Path
import re
import zipfile

from PIL import Image, ImageChops
from psd_tools import PSDImage
from psd_tools.constants import ChannelID, Tag


ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "content/mockups"
OUTPUT = ROOT / "public/mockups/local"
MANIFEST = ROOT / "src/data/generated-mockup-assets.json"
MAX_SIZE = 1800
# This template's embedded sample has transparent margins inside the actual
# paper. Its enclosing group mask, not the sample alpha, defines full bleed.
PARENT_PAPER_MASKS = {"mdu056"}


def design_layers(psd):
    """Exclude the hidden, untransformed copies used for Photoshop editing."""
    return [
        layer
        for layer in psd.descendants()
        if layer.kind == "smartobject"
        and layer.is_visible()
        and layer.name.lower().startswith(("design", "poster", "top", "flyer", "cover", "left", "right"))
    ]


def page_mask(psd, layer, *, use_artwork_alpha=True):
    """Combine raster alpha and every enclosing Photoshop mask in photo space."""
    if use_artwork_alpha:
        alpha = layer.topil(ChannelID.TRANSPARENCY_MASK, apply_icc=False)
        if alpha is None:
            alpha = Image.new("L", layer.size, 255)
        result = Image.new("L", psd.size, 0)
        result.paste(alpha, (layer.left, layer.top))
    else:
        if layer.parent is psd or layer.parent.mask is None or layer.parent.mask.disabled:
            raise ValueError(f"{layer.name}: full bleed requires an enclosing paper mask")
        result = Image.new("L", psd.size, 255)

    ancestor = layer
    while ancestor is not psd:
        mask = ancestor.mask
        if mask is not None and not mask.disabled:
            # `real` combines raster and vector masks when Photoshop supplies it.
            raster = mask.topil(real=True, apply_icc=False)
            if mask.has_real():
                left, top = mask.data.real_left, mask.data.real_top
                background = mask.data.real_background_color
            else:
                left, top = mask.left, mask.top
                background = mask.background_color
            full = Image.new("L", psd.size, background if background is not None else 255)
            if raster is not None:
                full.paste(raster, (left, top))
            result = ImageChops.multiply(result, full)
        ancestor = ancestor.parent
    return result


def paper_mask_surface(layer, scale):
    """Cover the complete flat sheet, including the one-pixel masked edge."""
    mask = layer.parent.mask
    if mask is None or mask.disabled:
        raise ValueError(f"{layer.name}: full bleed requires an enclosing paper mask")
    if mask.has_real():
        left, top = mask.data.real_left, mask.data.real_top
        right, bottom = mask.data.real_right, mask.data.real_bottom
    else:
        left, top, right, bottom = mask.left, mask.top, mask.right, mask.bottom
    return [[round(x * scale[0], 4), round(y * scale[1], 4)] for x, y in
            ((left, top), (right, top), (right, bottom), (left, bottom))]


def placement(layer, scale):
    transform = layer.smart_object.transform_box
    if transform is None or len(transform) != 8:
        raise ValueError(f"{layer.name}: missing smart-object transform")
    points = [
        [
            round(float(transform[index]) * scale[0], 4),
            round(float(transform[index + 1]) * scale[1], 4),
        ]
        for index in range(0, 8, 2)
    ]
    for key in (Tag.SMART_OBJECT_LAYER_DATA1, Tag.SMART_OBJECT_LAYER_DATA2):
        block = layer.tagged_blocks.get_data(key)
        if block is not None:
            size = block.data.get(b"Sz  ")
            if size:
                width, height = float(size[b"Wdth"]), float(size[b"Hght"])
                return points, [600, round(600 * height / width, 4)]
    raise ValueError(f"{layer.name}: missing original smart-object dimensions")


# Measured Photoshop Cylinder coefficients (g, hidden-u, x handle, y handle,
# y tangent). These numeric calibration data describe the preset geometry:
# https://github.com/storytold/photocraft/issues/4112
CYLINDER_COEFFICIENTS = (
    (0.000, 0.166169, 0.655404, 0.382374, 1.003104),
    (0.025, 0.157304, 0.650228, 0.388326, 1.002685),
    (0.050, 0.148438, 0.645374, 0.394211, 1.007918),
    (0.075, 0.140060, 0.639652, 0.401415, 1.006938),
    (0.100, 0.131885, 0.634064, 0.408465, 1.006069),
    (0.125, 0.123875, 0.628845, 0.414586, 1.005743),
    (0.150, 0.116162, 0.623565, 0.421033, 1.005233),
    (0.175, 0.108674, 0.618563, 0.426905, 1.004990),
    (0.200, 0.101198, 0.614439, 0.431943, 1.010787),
    (0.225, 0.094322, 0.609611, 0.437749, 1.010560),
    (0.250, 0.087757, 0.604929, 0.443406, 1.010361),
    (0.275, 0.081514, 0.600390, 0.448907, 1.010190),
    (0.300, 0.075599, 0.596012, 0.454288, 1.010019),
    (0.325, 0.069994, 0.591836, 0.459420, 1.009888),
    (0.350, 0.064709, 0.587844, 0.464361, 1.009768),
    (0.375, 0.059740, 0.584026, 0.469109, 1.009669),
    (0.400, 0.055072, 0.580427, 0.473609, 1.009588),
    (0.425, 0.050712, 0.576990, 0.477904, 1.009528),
    (0.450, 0.046635, 0.573760, 0.481968, 1.009477),
    (0.475, 0.042824, 0.570758, 0.485764, 1.009440),
    (0.500, 0.039295, 0.567910, 0.489377, 1.009411),
    (0.525, 0.036023, 0.565229, 0.492800, 1.009382),
    (0.550, 0.032681, 0.563478, 0.495519, 1.015285),
    (0.575, 0.029877, 0.561152, 0.498513, 1.015270),
    (0.600, 0.027282, 0.559012, 0.501313, 1.015245),
    (0.625, 0.024894, 0.557004, 0.503913, 1.015241),
    (0.650, 0.022693, 0.555163, 0.506331, 1.015225),
    (0.675, 0.020668, 0.553463, 0.508575, 1.015213),
    (0.700, 0.018816, 0.551877, 0.510651, 1.015217),
    (0.725, 0.017106, 0.550434, 0.512556, 1.015214),
    (0.750, 0.015542, 0.549100, 0.514319, 1.015213),
    (0.775, 0.014115, 0.547868, 0.515936, 1.015223),
    (0.800, 0.012806, 0.546743, 0.517432, 1.015223),
    (0.825, 0.011600, 0.545730, 0.518775, 1.015228),
    (0.850, 0.010506, 0.544788, 0.520034, 1.015230),
    (0.875, 0.009510, 0.543920, 0.521179, 1.015238),
    (0.900, 0.008600, 0.543134, 0.522224, 1.015244),
    (0.925, 0.007763, 0.542420, 0.523173, 1.015251),
    (0.950, 0.007006, 0.541757, 0.524065, 1.015252),
    (0.975, 0.006315, 0.541164, 0.524867, 1.015252),
    (1.000, 0.005686, 0.540608, 0.525602, 1.015261),
)


def normalized_warp(u, v, points):
    """Normalize the control hull, which Photoshop maps onto its placement quad.

    The hull is deliberately not the source bounds or the evaluated outline:
    https://github.com/storytold/photocraft/issues/3671
    """
    if not all(math.isfinite(value) for point in points for value in point):
        raise ValueError("Warp control points must be finite")
    xs, ys = zip(*points)
    left, right, top, bottom = min(xs), max(xs), min(ys), max(ys)
    if right <= left or bottom <= top:
        raise ValueError("Warp control hull must have positive dimensions")
    return {
        "u": [round(value, 8) for value in u],
        "v": [round(value, 8) for value in v],
        "points": [
            [round((x - left) / (right - left), 8),
             round((y - top) / (bottom - top), 8)]
            for x, y in points
        ],
    }


def surface_warp(layer):
    """Export row-major bicubic controls in normalized placement coordinates."""
    config = next((
        layer.tagged_blocks.get_data(key)
        for key in (Tag.SMART_OBJECT_LAYER_DATA1, Tag.SMART_OBJECT_LAYER_DATA2)
        if layer.tagged_blocks.get_data(key) is not None
    ), None)
    warp = config.data.get(b"warp") if config is not None else None
    if warp is None or warp[b"warpStyle"].enum == b"warpNone":
        return None
    if any(float(warp.get(key, 0)) != 0 for key in (b"warpPerspective", b"warpPerspectiveOther")):
        raise ValueError(f"{layer.name}: unsupported warp perspective")
    style = warp[b"warpStyle"].enum
    if style == b"warpCustom":
        if int(warp[b"uOrder"]) != 4 or int(warp[b"vOrder"]) != 4:
            raise ValueError(f"{layer.name}: expected bicubic custom warp")
        mesh = warp[b"customEnvelopeWarp"][b"meshPoints"]
        points = list(zip(map(float, mesh[b"Hrzn"]), map(float, mesh[b"Vrtc"])))
        if len(points) != 16:
            raise ValueError(f"{layer.name}: expected 16 custom control points")
        return normalized_warp([0, 1], [0, 1], points)
    if style == b"warpCylinder":
        if warp[b"warpRotate"].enum != b"Hrzn":
            raise ValueError(f"{layer.name}: expected horizontal cylinder")
        values = list(map(float, warp[b"warpValues"]))
        if len(values) != 7 or not all(map(math.isfinite, values)):
            raise ValueError(f"{layer.name}: invalid cylinder parameters")
        left, bottom, right, top, top_depth, bottom_depth, wrap = values
        if right <= left or bottom <= top:
            raise ValueError(f"{layer.name}: invalid cylinder extent")
        amount = min(1.0, max(0.0, wrap)) * (len(CYLINDER_COEFFICIENTS) - 1)
        index = min(math.floor(amount), len(CYLINDER_COEFFICIENTS) - 2)
        fraction = amount - index
        a, b = CYLINDER_COEFFICIENTS[index:index + 2]
        hidden, x_handle, y_handle, y_tangent = [
            start + (end - start) * fraction for start, end in zip(a[1:], b[1:])
        ]
        radius, center = (right - left) / 2, (right + left) / 2
        xs = [-1, -1, -x_handle, 0, x_handle, 1, 1]
        ellipse = [0, y_handle, y_tangent, 1, y_tangent, y_handle, 0]
        points = []
        for row in range(4):
            for x, depth in zip(xs, ellipse):
                y0 = top + top_depth * radius * depth
                y1 = bottom + bottom_depth * radius * depth
                points.append((center + radius * x, y0 + (y1 - y0) * row / 3))
        # Omit the two collapsed back patches. Their source pixels are hidden
        # behind the cylinder; the remaining u range is the visible front.
        return normalized_warp([hidden, 0.5, 1 - hidden], [0, 1], points)
    raise ValueError(f"{layer.name}: unsupported warp style {style!r}")


def archive_documents(bundle, archive):
    """Give every angle in a pack a stable ID, retaining legacy single-scene IDs."""
    archive_id = archive.stem.split("_", 1)[0].lower()
    documents = sorted(
        name for name in bundle.namelist()
        if name.lower().endswith(".psd")
        and not any(part.startswith((".", "__MACOSX")) for part in Path(name).parts)
    )
    if not documents:
        raise ValueError(f"{archive.name}: no PSD documents found")
    scenes = []
    for document in documents:
        suffix = re.search(r"_(\d+)$", Path(document).stem)
        if len(documents) > 1 and suffix is None:
            raise ValueError(f"{archive.name}: multi-scene document needs a numeric suffix: {document}")
        asset_id = archive_id if len(documents) == 1 else f"{archive_id}-{int(suffix[1])}"
        if any(scene_id == asset_id for scene_id, _ in scenes):
            raise ValueError(f"{archive.name}: duplicate scene ID {asset_id}")
        scenes.append((asset_id, document))
    return scenes


def export_scene(psd, archive, asset_id, document, *, metadata_only=False, existing=None):

    layers = design_layers(psd)
    if not layers:
        raise ValueError(f"{archive.name}: no visible print surfaces found")
    scale = min(1, MAX_SIZE / max(psd.size))
    dimensions = tuple(round(dimension * scale) for dimension in psd.size)
    axis_scale = (dimensions[0] / psd.width, dimensions[1] / psd.height)
    if metadata_only and (
        existing is None
        or (existing["width"], existing["height"]) != dimensions
        or len(existing["pages"]) != len(layers)
    ):
        raise ValueError(f"{archive.name}: matching exports required for --metadata-only")
    pages = []
    for index, layer in enumerate(layers, start=1):
        surface, plane = placement(layer, axis_scale)
        full_paper = asset_id in PARENT_PAPER_MASKS
        if full_paper:
            surface = paper_mask_surface(layer, axis_scale)
        if metadata_only:
            page = dict(existing["pages"][index - 1])
            if not (OUTPUT.parent / page["mask"]).is_file():
                raise ValueError(f"{archive.name}: missing exported mask")
        else:
            mask = page_mask(psd, layer, use_artwork_alpha=not full_paper).resize(
                dimensions, Image.Resampling.LANCZOS
            )
            if mask.getbbox() is None:
                raise ValueError(f"{archive.name}: {layer.name} has an empty mask")
            # CSS mask-image uses alpha, rather than luminance, for raster images.
            rgba = Image.new("RGBA", dimensions, "white")
            rgba.putalpha(mask)
            mask_file = f"{asset_id}-{index}-mask.webp"
            rgba.save(OUTPUT / mask_file, "WEBP", lossless=True, method=6)
            page = {"mask": f"local/{mask_file}", "bounds": list(mask.getbbox())}
        # Off-camera banners retain their complete transform. The exported
        # full-image mask clips them without changing the typography's scale.
        page.update(surface=surface, plane=plane)
        warp = surface_warp(layer)
        if warp is not None:
            page["warp"] = warp
        else:
            page.pop("warp", None)
        pages.append(page)

    if not metadata_only:
        for layer in psd.descendants():
            if layer.kind == "smartobject" or layer.name.lower() == "delete this layer":
                layer.visible = False
        # Keep the photographed substrate, lighting and texture, without artwork.
        image = psd.composite(force=True)
        if image is None:
            raise ValueError(f"{archive.name}: PSD could not be composited")
        image.convert("RGB").resize(dimensions, Image.Resampling.LANCZOS).save(
            OUTPUT / f"{asset_id}.webp", "WEBP", quality=85, method=6
        )

    print(
        f"{asset_id}: {dimensions[0]}×{dimensions[1]}, {len(pages)} print surfaces",
        flush=True,
    )
    return {
        "id": asset_id,
        "archive": archive.name,
        "document": document,
        "width": dimensions[0],
        "height": dimensions[1],
        "pages": pages,
    }


def export_archive(archive, *, metadata_only=False, existing=None):
    # Decode and release one PSD at a time; the packs contain several large files.
    with zipfile.ZipFile(archive) as bundle:
        for asset_id, document in archive_documents(bundle, archive):
            psd = PSDImage.open(io.BytesIO(bundle.read(document)))
            yield export_scene(
                psd, archive, asset_id, document,
                metadata_only=metadata_only, existing=(existing or {}).get(asset_id),
            )
            del psd
            # Layer/parent references form cycles in psd-tools.
            gc.collect()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "prefixes", nargs="*", help="Optional archive prefixes, such as MDU090"
    )
    parser.add_argument(
        "--metadata-only", action="store_true",
        help="Update placement and warp data while retaining existing photos and masks",
    )
    args = parser.parse_args()
    archives = sorted(SOURCES.glob("*.zip"))
    if args.prefixes:
        archives = [
            archive for archive in archives
            if any(archive.stem.lower().startswith(prefix.lower()) for prefix in args.prefixes)
        ]
    if not archives:
        parser.error("No matching source archives found in content/mockups")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    entries = (
        {entry["id"]: entry for entry in json.loads(MANIFEST.read_text())}
        if (args.prefixes or args.metadata_only) and MANIFEST.exists() else {}
    )
    for archive in archives:
        for entry in export_archive(archive, metadata_only=args.metadata_only, existing=entries):
            entries[entry["id"]] = entry
    MANIFEST.write_text(
        json.dumps(sorted(entries.values(), key=lambda entry: entry["id"]), indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
