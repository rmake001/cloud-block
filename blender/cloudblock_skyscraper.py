"""Generate the CloudBlock night skyscraper scene, preview, and GLB.

Run from the repository root with:
    blender --background --python blender/cloudblock_skyscraper.py

The script writes cloudblock_skyscraper.blend, cloudblock_preview.png, and
cloudblock_building.glb next to this file. The GLB contains only the building
collection; atmospheric fog, camera, and lighting stay Blender-side.
"""

from pathlib import Path

import bpy
from mathutils import Vector


OUTPUT_DIR = Path(__file__).resolve().parent
FLOOR_COUNT = 18
UNITS_PER_FLOOR = 5
FLOOR_HEIGHT = 3.7
BUILDING_WIDTH = 22.0
BODY_DEPTH = 3.6


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.name != "Collection":
            bpy.data.collections.remove(collection)


def new_collection(name):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj, collection):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def principled_material(name, color, metallic=0.0, roughness=0.5):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return material


def emissive_material(name, color, strength):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (*color, 1.0)
    emission.inputs["Strength"].default_value = strength
    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def add_box(name, location, dimensions, material, collection, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    move_to_collection(obj, collection)
    if bevel:
        modifier = obj.modifiers.new("Soft architectural edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return obj


def append_box(vertices, faces, material_ids, center, dimensions, material_id):
    cx, cy, cz = center
    sx, sy, sz = (dimension / 2.0 for dimension in dimensions)
    start = len(vertices)
    vertices.extend(
        [
            (cx - sx, cy - sy, cz - sz),
            (cx + sx, cy - sy, cz - sz),
            (cx + sx, cy + sy, cz - sz),
            (cx - sx, cy + sy, cz - sz),
            (cx - sx, cy - sy, cz + sz),
            (cx + sx, cy - sy, cz + sz),
            (cx + sx, cy + sy, cz + sz),
            (cx - sx, cy + sy, cz + sz),
        ]
    )
    faces.extend(
        [
            (start + 0, start + 3, start + 2, start + 1),
            (start + 4, start + 5, start + 6, start + 7),
            (start + 0, start + 1, start + 5, start + 4),
            (start + 1, start + 2, start + 6, start + 5),
            (start + 2, start + 3, start + 7, start + 6),
            (start + 3, start + 0, start + 4, start + 7),
        ]
    )
    material_ids.extend([material_id] * 6)


def make_window(floor, unit, x, z, building_collection, frame, glass):
    width = 2.65
    height = 2.45
    depth = 0.32
    frame_width = 0.15
    vertices = []
    faces = []
    material_ids = []

    append_box(
        vertices,
        faces,
        material_ids,
        (0.0, 0.0, 0.0),
        (width, depth, frame_width),
        0,
    )
    append_box(
        vertices,
        faces,
        material_ids,
        (0.0, 0.0, height - frame_width),
        (width, depth, frame_width),
        0,
    )
    append_box(
        vertices,
        faces,
        material_ids,
        (-(width - frame_width) / 2.0, 0.0, height / 2.0),
        (frame_width, depth, height),
        0,
    )
    append_box(
        vertices,
        faces,
        material_ids,
        ((width - frame_width) / 2.0, 0.0, height / 2.0),
        (frame_width, depth, height),
        0,
    )
    append_box(
        vertices,
        faces,
        material_ids,
        (0.0, -depth * 0.08, height / 2.0),
        (0.055, depth * 0.82, height - frame_width * 2.0),
        0,
    )
    append_box(
        vertices,
        faces,
        material_ids,
        (0.0, depth * 0.12, height / 2.0),
        (width - frame_width * 2.0, depth * 0.48, height - frame_width * 2.0),
        1,
    )

    mesh = bpy.data.meshes.new(f"Window_F{floor:02d}_U{unit:02d}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(frame)
    mesh.materials.append(glass)
    mesh.update()
    for polygon, material_id in zip(mesh.polygons, material_ids):
        polygon.material_index = material_id

    obj = bpy.data.objects.new(f"Window_F{floor:02d}_U{unit:02d}", mesh)
    obj.location = (x, -1.38, z - height / 2.0)
    obj["floor"] = floor
    obj["unit"] = unit
    obj["interactive"] = True
    building_collection.objects.link(obj)
    return obj


def point_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_area_light(name, location, target, color, energy, size, collection):
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    point_at(obj, target)
    collection.objects.link(obj)
    return obj


def create_fog_material():
    material = bpy.data.materials.new("Render Fog | cool silver-gray")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    volume = nodes.new("ShaderNodeVolumePrincipled")
    volume.inputs["Color"].default_value = (0.32, 0.39, 0.47, 1.0)
    volume.inputs["Density"].default_value = 0.035
    volume.inputs["Anisotropy"].default_value = 0.35
    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(volume.outputs["Volume"], output.inputs["Volume"])
    return material


def add_fog_bank(name, location, scale, material, collection):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        radius=1.0,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    move_to_collection(obj, collection)
    obj["app_effect"] = "Recreate as an animated volumetric cloud; omit from building mesh."
    return obj


def create_scene():
    clear_scene()
    scene = bpy.context.scene
    building = new_collection("CLOUDBLOCK | GLB BUILDING")
    atmosphere = new_collection("CLOUDBLOCK | ATMOSPHERE (RENDER ONLY)")
    lighting = new_collection("CLOUDBLOCK | CAMERA AND LIGHTS")

    charcoal = principled_material(
        "Facade | graphite ceramic",
        (0.018, 0.026, 0.039),
        metallic=0.48,
        roughness=0.3,
    )
    shadow = principled_material(
        "Recesses | blue charcoal",
        (0.026, 0.048, 0.071),
        metallic=0.42,
        roughness=0.34,
    )
    metal = principled_material(
        "Trim | midnight titanium",
        (0.075, 0.112, 0.15),
        metallic=0.72,
        roughness=0.28,
    )
    window_frame = principled_material(
        "Window frames | smoked steel",
        (0.035, 0.052, 0.067),
        metallic=0.64,
        roughness=0.24,
    )
    amber_glass = emissive_material(
        "Apartment lights | warm amber",
        (1.0, 0.38, 0.075),
        strength=2.0,
    )
    amber_dim = emissive_material(
        "Apartment lights | soft gold",
        (0.94, 0.55, 0.19),
        strength=0.85,
    )

    body_height = FLOOR_COUNT * FLOOR_HEIGHT + 7.4
    body_center_z = FLOOR_COUNT * FLOOR_HEIGHT / 2.0
    add_box(
        "Tower_Core | 18-floor facade",
        (0.0, 0.55, body_center_z),
        (BUILDING_WIDTH, BODY_DEPTH, body_height),
        charcoal,
        building,
    )
    add_box(
        "Crown | recessed roof cap",
        (0.0, 0.48, FLOOR_COUNT * FLOOR_HEIGHT + 1.45),
        (BUILDING_WIDTH + 1.0, BODY_DEPTH + 0.8, 2.9),
        shadow,
        building,
        bevel=0.14,
    )

    for floor in range(1, FLOOR_COUNT + 1):
        floor_line = floor * FLOOR_HEIGHT
        add_box(
            f"FloorSlab_F{floor:02d}",
            (0.0, 0.22, floor_line),
            (BUILDING_WIDTH + 0.35, BODY_DEPTH + 0.35, 0.17),
            metal,
            building,
            bevel=0.035,
        )
        window_z = floor_line - FLOOR_HEIGHT / 2.0
        for unit in range(1, UNITS_PER_FLOOR + 1):
            x = (unit - (UNITS_PER_FLOOR + 1) / 2.0) * 3.65
            glass = amber_glass if (floor + unit * 2) % 4 != 0 else amber_dim
            make_window(floor, unit, x, window_z, building, window_frame, glass)

    for index, x in enumerate((-10.42, -5.4, 5.4, 10.42), start=1):
        add_box(
            f"VerticalRib_{index:02d}",
            (x, -1.05, body_center_z),
            (0.18, 0.28, body_height - 1.0),
            shadow,
            building,
            bevel=0.035,
        )

    for side in (-1, 1):
        add_box(
            f"CornerSpine_{'L' if side < 0 else 'R'}",
            (side * 10.95, 0.42, body_center_z),
            (0.32, BODY_DEPTH + 0.25, body_height + 1.2),
            metal,
            building,
            bevel=0.06,
        )

    fog = create_fog_material()
    fog_banks = [
        ("FogBank_01 | low left", (-9.0, -4.4, 14.0), (7.2, 1.7, 1.15)),
        ("FogBank_02 | mid right", (10.4, -3.7, 25.0), (6.2, 1.5, 1.0)),
        ("FogBank_03 | upper left", (-10.0, -5.0, 39.0), (7.5, 1.8, 1.25)),
        ("FogBank_04 | mid left", (-10.5, -4.1, 52.0), (6.4, 1.5, 1.05)),
        ("FogBank_05 | upper right", (9.5, -4.8, 61.0), (7.0, 1.7, 1.15)),
        ("FogBank_06 | drifting low", (8.0, -5.4, 5.5), (5.8, 1.6, 0.95)),
    ]
    for name, location, scale in fog_banks:
        add_fog_bank(name, location, scale, fog, atmosphere)

    world = (
        bpy.data.worlds.new("Night | deep blue charcoal")
        if len(bpy.data.worlds) == 0
        else bpy.data.worlds[0]
    )
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.008, 0.014, 0.026, 1.0)
    background.inputs["Strength"].default_value = 0.2

    add_area_light(
        "Key | cool moonlight",
        (2.0, -18.0, 39.0),
        (0.0, 0.0, 34.0),
        (0.43, 0.61, 0.84),
        2300,
        18.0,
        lighting,
    )
    add_area_light(
        "Rim | blue edge light",
        (-13.0, 1.0, 42.0),
        (0.0, 0.0, 35.0),
        (0.19, 0.38, 0.68),
        3000,
        14.0,
        lighting,
    )
    add_area_light(
        "Soft fill | facade",
        (12.0, -14.0, 23.0),
        (0.0, -0.5, 28.0),
        (0.37, 0.47, 0.62),
        800,
        13.0,
        lighting,
    )

    camera_data = bpy.data.cameras.new("CloudBlock | portrait facade camera")
    camera = bpy.data.objects.new("Camera | 9:16 tower close-up", camera_data)
    camera.location = (2.7, -52.0, 34.5)
    point_at(camera, (0.0, 0.0, 34.5))
    camera_data.type = "PERSP"
    camera_data.lens = 34.0
    camera_data.sensor_fit = "VERTICAL"
    camera_data.sensor_height = 24.0
    scene.camera = camera
    lighting.objects.link(camera)

    scene.render.engine = (
        "BLENDER_EEVEE_NEXT" if bpy.app.version >= (4, 2, 0) else "BLENDER_EEVEE"
    )
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 32
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1280
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.filepath = str(OUTPUT_DIR / "cloudblock_preview.png")
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0

    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(OUTPUT_DIR / "cloudblock_preview.png")
    scene.camera.data.dof.use_dof = False
    scene.render.resolution_percentage = 100
    scene.unit_settings.system = "METRIC"

    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_perspective = "CAMERA"

    return scene, building


def export_building_glb(collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(
        (obj for obj in collection.objects if obj.name.startswith("Tower_Core")),
        None,
    )
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_DIR / "cloudblock_building.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
    )
    bpy.ops.object.select_all(action="DESELECT")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    scene, building = create_scene()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_DIR / "cloudblock_skyscraper.blend"))
    bpy.ops.render.render(write_still=True)
    export_building_glb(building)
    print(f"CloudBlock scene, preview, and GLB exported to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
