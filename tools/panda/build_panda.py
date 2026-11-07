# Builds the chibi panda agent in Blender and exports it as assets/models/panda.glb.
#
# This is the "Blender" step of the concept -> 3D -> Blender -> Three.js pipeline, done in code so anyone can
# rebuild the model the same way. Run it with Blender's Python module (pip install bpy) or with Blender itself:
#   python tools/panda/build_panda.py            (with bpy installed)
#   blender -b -P tools/panda/build_panda.py
#
# Panda anatomy we keep: a chunky round body on four short legs (not standing up like a person), black legs,
# a black band over the shoulders that joins the front legs, white rump, black round ears, black eye patches that
# slant down and out, a white muzzle with a black nose, and a TINY white stub tail.
# Chibi style: the head is wider than the body, and the legs are short and stubby.
#
# Parts are separate, named objects so the app can animate them in code: Body > Head, and LegFL, LegFR, LegBL,
# LegBR. Each has its pivot where it bends (hips and neck). The panda faces +X. Colours are vertex colours on one
# material, so the whole panda is a handful of draw calls and needs no texture.
import bpy, bmesh, math, os
from mathutils import Vector, Euler

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "models", "panda.glb")
WHITE, BLACK, GLINT = (0.96, 0.96, 0.94, 1), (0.035, 0.035, 0.045, 1), (1, 1, 1, 1)

bpy.ops.wm.read_factory_settings(use_empty=True)
mat = bpy.data.materials.new("Panda")
mat.use_nodes = True
nodes = mat.node_tree.nodes
bsdf = nodes.get("Principled BSDF")
vc = nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"
mat.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.85


def blob(name, radii, loc, color, segs=16, rings=10, rot=(0, 0, 0)):
    """An ellipsoid in world space. color is an RGBA tuple or a function of the face centre (world coords)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    m = Euler(rot).to_matrix().to_4x4()
    for v in bm.verts:
        v.co = m @ Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2])) + Vector(loc)
    bm.to_mesh(me); bm.free()
    attr = me.color_attributes.new(name="Color", type="BYTE_COLOR", domain="CORNER")
    for poly in me.polygons:
        c = color(poly.center) if callable(color) else color
        for li in poly.loop_indices:
            attr.data[li].color = c
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def join(name, parts, pivot):
    """Join parts into one object whose origin (pivot) is where it bends."""
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    if len(parts) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = ob.data.name = name
    ob.data.transform(__import__("mathutils").Matrix.Translation(-Vector(pivot)))
    ob.location = pivot
    return ob


def parent(child, par):
    w = child.matrix_world.copy()
    child.parent = par
    child.matrix_world = w


# ---- body: white, with the black shoulder band ----
BODY_C = (0.0, 0.0, 0.45)   # low and round, so only the bottom of each stubby leg shows
band = lambda c: BLACK if 0.0 <= c.x <= 0.30 else WHITE
body = blob("body", (0.52, 0.40, 0.37), BODY_C, band, segs=32, rings=16)
tail = blob("tail", (0.06, 0.075, 0.07), (-0.53, 0, 0.57), WHITE, segs=10, rings=6)   # tiny stub
Body = join("Body", [body, tail], (0.0, 0.0, 0.35))

# ---- head: big, round and wide ----
H = Vector((0.44, 0.0, 0.90))
head = blob("head", (0.40, 0.47, 0.40), H, WHITE, segs=24, rings=16)
ears = [blob(f"ear{s}", (0.08, 0.14, 0.13), H + Vector((-0.06, 0.29 * s, 0.32)), BLACK, segs=12, rings=8,
             rot=(math.radians(20 * s), 0, 0)) for s in (1, -1)]
# eye patches: flat ovals that slant down and out, turned to follow the curve of the face
patches = [blob(f"patch{s}", (0.06, 0.12, 0.16), H + Vector((0.335, 0.165 * s, 0.01)), BLACK, segs=14, rings=8,
                rot=(math.radians(28 * s), 0, math.radians(24 * s))) for s in (1, -1)]
glints = [blob(f"glint{s}", (0.025, 0.035, 0.035), H + Vector((0.392, 0.15 * s, 0.06)), GLINT, segs=8, rings=5)
          for s in (1, -1)]
muzzle = blob("muzzle", (0.14, 0.17, 0.11), H + Vector((0.32, 0, -0.13)), WHITE, segs=16, rings=10)
nose = blob("nose", (0.04, 0.065, 0.035), H + Vector((0.455, 0, -0.075)), BLACK, segs=10, rings=6)
Head = join("Head", [head, *ears, *patches, *glints, muzzle, nose], (0.36, 0.0, 0.64))

# ---- four short black legs, pivots at the hips ----
legs = []
# Each leg reaches well up inside the body, and its hip pivot is high, so it never comes loose when it swings.
for nm, x, sy, r in (("LegFL", 0.23, 1, 0.145), ("LegFR", 0.23, -1, 0.145), ("LegBL", -0.24, 1, 0.16), ("LegBR", -0.24, -1, 0.16)):
    leg = blob(nm, (r, r, 0.26), (x, 0.15 * sy, 0.26), BLACK, segs=14, rings=8)
    paw = blob(nm + "paw", (r * 1.08, r * 1.0, 0.075), (x + 0.03, 0.15 * sy, 0.065), BLACK, segs=14, rings=6)
    legs.append(join(nm, [leg, paw], (x, 0.15 * sy, 0.44)))

root = bpy.data.objects.new("Panda", None)
bpy.context.collection.objects.link(root)
parent(Head, Body)
for o in [Body, *legs]:
    parent(o, root)

tris = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == "MESH" for p in o.data.polygons)
print(f"panda: {tris} triangles")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT), export_format="GLB", export_texcoords=False,
                          export_normals=True, export_animations=False, export_vertex_color="MATERIAL",
                          export_yup=True)
print("wrote", os.path.abspath(OUT), os.path.getsize(OUT), "bytes")
