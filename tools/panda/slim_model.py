# Slims down a 3D model (for example one made by an image-to-3D tool) so it is light enough for phones.
# It cuts the triangle count with Blender's Decimate modifier and shrinks any textures, then saves a new .glb.
#
#   python tools/panda/slim_model.py in.glb out.glb [max_triangles=6000] [max_texture_px=512]
#   (or: blender -b -P tools/panda/slim_model.py -- in.glb out.glb 6000 512)
#
# This does not rig or split the model. For the app to animate a character, it still needs separate, named
# parts (Body, Head, LegFL, LegFR, LegBL, LegBR) with pivots at the joints, like tools/panda/build_panda.py
# makes. A model from an image-to-3D tool usually comes as one piece, so that step is done by hand in Blender.
import bpy, os, sys

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
src, out = args[0], args[1]
max_tris = int(args[2]) if len(args) > 2 else 6000
max_px = int(args[3]) if len(args) > 3 else 512

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
count = lambda: sum(len(p.vertices) - 2 for o in meshes for p in o.data.polygons)
before = count()
ratio = min(1.0, max_tris / max(1, before))
if ratio < 1.0:
    for o in meshes:
        bpy.context.view_layer.objects.active = o
        m = o.modifiers.new("slim", "DECIMATE")
        m.ratio = ratio
        bpy.ops.object.modifier_apply(modifier=m.name)
for img in bpy.data.images:
    w, h = img.size
    if max(w, h) > max_px:
        k = max_px / max(w, h)
        img.scale(max(1, int(w * k)), max(1, int(h * k)))
bpy.ops.export_scene.gltf(filepath=os.path.abspath(out), export_format="GLB", export_image_format="JPEG")
print(f"triangles {before} -> {count()}; {os.path.getsize(src)} -> {os.path.getsize(out)} bytes")
