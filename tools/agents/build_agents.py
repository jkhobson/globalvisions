# Builds every agent animal in Blender and exports each one as assets/models/<name>.glb.
#
# This is the "Blender" step of the concept -> 3D -> Blender -> Three.js pipeline, done in code so the animals
# can be rebuilt and tweaked exactly. Run it with Blender's Python module (pip install bpy) or with Blender:
#   python tools/agents/build_agents.py [name ...]      (with bpy installed; no names = all of them)
#   blender -b -P tools/agents/build_agents.py -- [name ...]
#
# House style: cute, short, chibi (big head, small body, stubby limbs). Each animal keeps its own real body shape
# (no animal heads on human bodies) and gets the parts its own movement needs, named so js/kit/agent3d.js can
# animate them. Every animal faces +X with its feet (or lowest point) on the ground at height 0, and its parts
# have their origins where they bend:
#   Body (with Head, Tail, WingL/R, FinL/R, Arm0-7 as children where the animal has them)
#   LegFL, LegFR, LegBL, LegBR, FootL, FootR (children of the root, so they stay on the ground)
# Colours are vertex colours on one material (no textures), so each animal is a handful of draw calls.
import bpy, bmesh, math, os, sys
from mathutils import Vector, Euler, Matrix

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "models")


def C(h, a=1.0):
    """'#rrggbb' -> an RGBA tuple (sRGB, as Blender's byte colours store it)."""
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (a,)


INK, WHITE, GLINT = C("#121318"), C("#f5f5f0"), C("#ffffff")
MAT = None


def reset():
    global MAT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MAT = bpy.data.materials.new("Agent")
    MAT.use_nodes = True
    nodes = MAT.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    vc = nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"
    MAT.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85


def _finish(name, bm, color):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    attr = me.color_attributes.new(name="Color", type="BYTE_COLOR", domain="CORNER")
    for poly in me.polygons:
        c = color(poly.center) if callable(color) else color
        for li in poly.loop_indices:
            attr.data[li].color = c
        poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(MAT)
    return ob


def blob(name, radii, loc, color, segs=16, rings=10, rot=(0, 0, 0)):
    """An ellipsoid in world space. color is an RGBA tuple or a function of the face centre (world coords)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    m = Euler(rot).to_matrix()
    for v in bm.verts:
        v.co = m @ Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2])) + Vector(loc)
    return _finish(name, bm, color)


def cone(name, base, tip, r, color, segs=10, squash=1.0):
    """A cone from base (radius r) to a point at tip. squash < 1 flattens it sideways (for fins and beaks)."""
    base, tip = Vector(base), Vector(tip)
    d = tip - base
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=segs, radius1=r, radius2=0.0, depth=d.length)
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix()
    for v in bm.verts:
        v.co = rot @ Vector((v.co.x, v.co.y * squash, v.co.z)) + (base + tip) / 2
    return _finish(name, bm, color)


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
    ob.data.transform(Matrix.Translation(-Vector(pivot)))
    ob.location = pivot
    return ob


def parent(child, par):
    bpy.context.view_layer.update()   # make matrix_world current first, or a part just moved is put back at 0, 0, 0
    w = child.matrix_world.copy()
    child.parent = par
    child.matrix_world = w


def eyes(H, dx, dy, dz, r=0.07, iris=INK):
    """A pair of big chibi eyes (dark, with a white glint) on the front of a head centred at H."""
    out = []
    for s in (1, -1):
        c = H + Vector((dx, dy * s, dz))
        out.append(blob(f"eye{s}", (r * 0.55, r, r * 1.15), c, iris, segs=12, rings=8))
        out.append(blob(f"glint{s}", (r * 0.3, r * 0.35, r * 0.35), c + Vector((r * 0.4, r * 0.25 * s, r * 0.4)), GLINT, segs=8, rings=5))
    return out


def legs4(x_front, x_back, y, r, color, top=0.52, hip=0.42, paw=None, r_back=None):
    """Four stubby legs that reach well up inside the body, with hip pivots high so they never come loose."""
    out = []
    rb = r_back or r
    for nm, x, s, r in (("LegFL", x_front, 1, r), ("LegFR", x_front, -1, r), ("LegBL", x_back, 1, rb), ("LegBR", x_back, -1, rb)):
        leg = blob(nm, (r, r, top / 2), (x, y * s, top / 2), color, segs=12, rings=8)
        p = blob(nm + "paw", (r * 1.08, r, 0.07), (x + 0.03, y * s, 0.065), paw or color, segs=12, rings=6)
        out.append(join(nm, [leg, p], (x, y * s, hip)))
    return out


def assemble(body, head=None, kids=(), ground=()):
    """Body (with head and other children) and ground parts under one root called Agent."""
    root = bpy.data.objects.new("Agent", None)
    bpy.context.collection.objects.link(root)
    if head:
        parent(head, body)
    for k in kids:
        parent(k, body)
    for o in [body, *ground]:
        parent(o, root)


# ------------------------------------------------------------------ the animals

def panda():
    # chunky round body on four short legs, black legs and a black band over the shoulders that joins the front
    # legs, white rump, black round ears, eye patches that slant down and out, a TINY white stub tail
    band = lambda c: INK if 0.0 <= c.x <= 0.30 else WHITE
    body = blob("body", (0.52, 0.42, 0.36), (0, 0, 0.40), band, segs=32, rings=16)
    tail = blob("tail", (0.06, 0.075, 0.07), (-0.53, 0, 0.52), WHITE, segs=10, rings=6)
    Body = join("Body", [body, tail], (0, 0, 0.30))
    H = Vector((0.44, 0, 0.84))
    head = blob("head", (0.40, 0.47, 0.40), H, WHITE, segs=24, rings=16)
    ears = [blob(f"ear{s}", (0.08, 0.14, 0.13), H + Vector((-0.06, 0.29 * s, 0.32)), INK, segs=12, rings=8,
                 rot=(math.radians(20 * s), 0, 0)) for s in (1, -1)]
    patches = [blob(f"patch{s}", (0.06, 0.12, 0.16), H + Vector((0.335, 0.165 * s, 0.01)), INK, segs=14, rings=8,
                    rot=(math.radians(28 * s), 0, math.radians(24 * s))) for s in (1, -1)]
    glints = [blob(f"glint{s}", (0.025, 0.035, 0.035), H + Vector((0.392, 0.15 * s, 0.06)), GLINT, segs=8, rings=5)
              for s in (1, -1)]
    muzzle = blob("muzzle", (0.14, 0.17, 0.11), H + Vector((0.32, 0, -0.13)), WHITE)
    nose = blob("nose", (0.04, 0.065, 0.035), H + Vector((0.455, 0, -0.075)), INK, segs=10, rings=6)
    Head = join("Head", [head, *ears, *patches, *glints, muzzle, nose], (0.36, 0, 0.58))
    legs = legs4(0.23, -0.24, 0.19, 0.165, INK, r_back=0.175)
    assemble(Body, Head, ground=legs)


def _cat(fur, belly, legc, stripes=False, fox=False):
    """Fox and tiger share a four-legged cat/dog shape, but each has its own head, ears, tail and markings."""
    def bodyc(c):
        if c.z < 0.30 and c.x > 0.05:
            return belly                                           # white chest and belly
        if stripes and c.z > 0.36 and math.sin(c.x * 26) > 0.55:
            return INK
        return fur
    body = blob("body", (0.48, 0.34, 0.31), (0, 0, 0.42), bodyc, segs=28, rings=14)
    Body = join("Body", [body], (0, 0, 0.32))
    H = Vector((0.42, 0, 0.86))

    def headc(c):
        if c.z < H.z - 0.06 and c.x > H.x + 0.12:
            return belly                                           # white cheeks
        if stripes and c.z > H.z + 0.18 and c.x > H.x - 0.05 and math.sin(c.y * 30) > 0.75:
            return INK                                             # a few stripes on the forehead
        return fur
    head = blob("head", (0.34, 0.40, 0.33), H, headc, segs=24, rings=14)
    parts = [head]
    if fox:
        parts += [cone(f"ear{s}", H + Vector((-0.02, 0.19 * s, 0.20)), H + Vector((-0.05, 0.27 * s, 0.54)), 0.12,
                       lambda c: INK if c.z > H.z + 0.44 else fur, segs=10, squash=0.55) for s in (1, -1)]
        parts.append(blob("snout", (0.22, 0.13, 0.10), H + Vector((0.30, 0, -0.10)), belly))
        parts.append(blob("nose", (0.045, 0.06, 0.045), H + Vector((0.52, 0, -0.07)), INK, segs=10, rings=6))
        parts += eyes(H, 0.29, 0.15, 0.05, r=0.065)
    else:
        parts += [blob(f"ear{s}", (0.06, 0.11, 0.10), H + Vector((-0.04, 0.26 * s, 0.27)), fur, segs=12, rings=8)
                  for s in (1, -1)]
        parts += [blob(f"earin{s}", (0.03, 0.07, 0.06), H + Vector((-0.005, 0.26 * s, 0.27)), INK, segs=10, rings=6)
                  for s in (1, -1)]
        parts.append(blob("muzzle", (0.15, 0.19, 0.11), H + Vector((0.27, 0, -0.12)), belly))
        parts.append(blob("nose", (0.045, 0.07, 0.04), H + Vector((0.41, 0, -0.06)), C("#e58b8b"), segs=10, rings=6))
        parts += eyes(H, 0.28, 0.15, 0.05, r=0.068)
    Head = join("Head", parts, (0.34, 0, 0.62))
    if fox:   # a big bushy tail with a white tip
        tail = blob("tail", (0.34, 0.15, 0.15), (-0.66, 0, 0.62), lambda c: WHITE if c.x < -0.86 else fur,
                    rot=(0, math.radians(-30), 0), segs=16, rings=10)
    else:     # a long thin striped tail with a black tip
        tail = blob("tail", (0.40, 0.06, 0.06), (-0.78, 0, 0.62),
                    lambda c: INK if c.x < -1.08 or math.sin(c.x * 30) > 0.6 else fur,
                    rot=(0, math.radians(-25), 0), segs=12, rings=10)
    Tail = join("Tail", [tail], (-0.40, 0, 0.50))
    legs = legs4(0.24, -0.24, 0.16, 0.12, legc, paw=legc)
    assemble(Body, Head, kids=[Tail], ground=legs)


def fox():
    _cat(C("#ec7a2c"), WHITE, C("#3b2a22"), fox=True)


def tiger():
    _cat(C("#f39a32"), WHITE, C("#f39a32"), stripes=True)


def turtle():
    shellc = lambda c: C("#5b4022") if math.sin(c.x * 15) * math.sin(c.y * 15) > 0.25 else C("#8a6232")
    shell = blob("shell", (0.50, 0.42, 0.32), (0, 0, 0.30), shellc, segs=24, rings=12)
    rim = blob("rim", (0.54, 0.46, 0.07), (0, 0, 0.24), C("#a8813f"), segs=24, rings=6)
    belly = blob("belly", (0.46, 0.36, 0.08), (0, 0, 0.19), C("#e8d27a"), segs=16, rings=6)
    tail = cone("tail", (-0.48, 0, 0.20), (-0.66, 0, 0.16), 0.06, C("#7cb342"), segs=8)
    Body = join("Body", [shell, rim, belly, tail], (0, 0, 0.20))
    H = Vector((0.60, 0, 0.40))
    green = C("#7cb342")
    head = blob("head", (0.24, 0.24, 0.22), H, green, segs=20, rings=12)
    neck = blob("neck", (0.18, 0.12, 0.10), (0.44, 0, 0.30), green)
    mouth = blob("mouth", (0.02, 0.10, 0.012), H + Vector((0.22, 0, -0.07)), C("#33691e"), segs=10, rings=4)
    Head = join("Head", [head, neck, mouth, *eyes(H, 0.19, 0.11, 0.05, r=0.06)], (0.40, 0, 0.28))
    legs = []
    for nm, x, s in (("LegFL", 0.30, 1), ("LegFR", 0.30, -1), ("LegBL", -0.28, 1), ("LegBR", -0.28, -1)):
        leg = blob(nm, (0.11, 0.11, 0.14), (x, 0.33 * s, 0.12), green, segs=12, rings=8)
        legs.append(join(nm, [leg], (x, 0.30 * s, 0.22)))
    assemble(Body, Head, ground=legs)


def _bird(feather, belly, wingc, tail=None, owl=False):
    body = blob("body", (0.36, 0.36, 0.42), (0, 0, 0.52), lambda c: belly(c) if c.x > 0.16 else feather, segs=24, rings=14)
    parts = [body]
    if tail:
        parts.append(cone("tail", (-0.22, 0, 0.45), (-0.80, 0, 0.12), 0.13, tail, segs=10, squash=0.45))
    Body = join("Body", parts, (0, 0, 0.12))
    H = Vector((0.06, 0, 1.00)) if owl else Vector((0.12, 0, 1.00))
    hp = [blob("head", (0.36, 0.38, 0.32) if owl else (0.30, 0.30, 0.28), H, feather, segs=24, rings=14)]
    if owl:
        for s in (1, -1):   # big facial discs, yellow eyes, ear tufts
            hp.append(blob(f"disc{s}", (0.06, 0.15, 0.15), H + Vector((0.28, 0.135 * s, 0)), C("#efe0bf")))
            hp.append(blob(f"iris{s}", (0.03, 0.095, 0.095), H + Vector((0.325, 0.135 * s, 0.01)), C("#f6c12c")))
            hp.append(blob(f"pupil{s}", (0.02, 0.06, 0.06), H + Vector((0.345, 0.135 * s, 0.01)), INK, segs=10, rings=6))
            hp.append(blob(f"glint{s}", (0.01, 0.022, 0.022), H + Vector((0.36, 0.115 * s, 0.035)), GLINT, segs=6, rings=4))
            hp.append(cone(f"tuft{s}", H + Vector((-0.02, 0.2 * s, 0.2)), H + Vector((-0.06, 0.3 * s, 0.45)), 0.08,
                           feather, segs=8, squash=0.6))
        hp.append(cone("beak", H + Vector((0.32, 0, -0.04)), H + Vector((0.40, 0, -0.17)), 0.045, C("#e0a030"), segs=8))
    else:               # parrot: white face patch and a big curved beak
        for s in (1, -1):
            hp.append(blob(f"face{s}", (0.05, 0.11, 0.10), H + Vector((0.22, 0.12 * s, 0.0)), WHITE))
        hp += eyes(H, 0.25, 0.12, 0.02, r=0.05)
        hp.append(blob("beak", (0.14, 0.09, 0.13), H + Vector((0.30, 0, -0.06)), C("#efe6d2"), rot=(0, math.radians(25), 0)))
        hp.append(blob("jaw", (0.08, 0.07, 0.05), H + Vector((0.26, 0, -0.17)), INK, segs=10, rings=6))
    Head = join("Head", hp, (H.x, 0, 0.80))
    wings = []
    for nm, s in (("WingL", 1), ("WingR", -1)):
        w = blob(nm, (0.30, 0.07, 0.36), (-0.04, 0.36 * s, 0.56), wingc, rot=(math.radians(-8 * s), 0, 0))
        wings.append(join(nm, [w], (0.0, 0.30 * s, 0.82)))
    feet = []
    for nm, s in (("FootL", 1), ("FootR", -1)):
        toes = [blob(f"{nm}t{i}", (0.09, 0.03, 0.025), (0.12, 0.13 * s + 0.04 * i, 0.03), C("#e0a030") if owl else C("#8a8f99"),
                     segs=8, rings=5, rot=(0, 0, math.radians(18 * i))) for i in (-1, 0, 1)]
        leg = blob(nm + "leg", (0.04, 0.04, 0.08), (0.06, 0.13 * s, 0.10), C("#e0a030") if owl else C("#8a8f99"), segs=8, rings=6)
        feet.append(join(nm, [*toes, leg], (0.06, 0.13 * s, 0.16)))
    assemble(Body, Head, kids=wings, ground=feet)


def owl():
    brown = C("#8d6748")
    speck = lambda c: C("#b08a66") if math.sin(c.z * 34) > 0.75 else C("#f0e2c4")   # a pale, lightly barred chest
    _bird(brown, speck, lambda c: C("#6d4c35") if math.sin(c.z * 30) > 0.4 else brown, owl=True)


def parrot():
    red = C("#d8322a")
    wing = lambda c: C("#2f6fe4") if c.z < 0.40 else (C("#f6c12c") if c.z < 0.62 else red)
    tail = lambda c: C("#2f6fe4") if c.z < 0.28 else red
    _bird(red, lambda c: red, wing, tail=tail)


def _sea(top, belly, size, rostrum, grooves=False):
    L, R = size
    def bodyc(c):
        if c.z < 0.40 - R * 0.25:
            if grooves and math.sin(c.y * 45) > 0.2:
                return C("#a9c3ef")
            return belly
        return top
    body = blob("body", (L, R, R), (0, 0, 0.45), bodyc, segs=28, rings=14)
    head = blob("head", (R * 1.15, R * 1.05, R * 1.05), (L * 0.65, 0, 0.47), bodyc, segs=24, rings=14)
    parts = [body, head, *eyes(Vector((L * 0.65, 0, 0.47)), R * 0.85, R * 0.62, 0.02, r=0.06)]
    if rostrum:
        parts.append(blob("rostrum", (0.18, 0.08, 0.06), (L * 0.65 + R * 1.1, 0, 0.40), bodyc))
    else:   # a wide smile line for the whale
        parts.append(blob("mouth", (0.02, R * 0.7, 0.012), (L * 0.65 + R * 1.05, 0, 0.36), C("#1d3a7a"), segs=12, rings=4))
    parts.append(cone("dorsal", (-0.05, 0, 0.45 + R * 0.85), (-0.18, 0, 0.45 + R * 0.85 + 0.20), 0.10, top, segs=8, squash=0.3))
    Body = join("Body", parts, (0, 0, 0.45))
    fins = []
    for nm, s in (("FinL", 1), ("FinR", -1)):
        f = blob(nm, (0.14, 0.12, 0.03), (L * 0.35, (R + 0.08) * s, 0.30), top, rot=(math.radians(-30 * s), 0, math.radians(-20)))
        fins.append(join(nm, [f], (L * 0.35, R * 0.8 * s, 0.36)))
    stock = blob("stock", (0.28, R * 0.45, R * 0.45), (-L - 0.12, 0, 0.47), top)
    fluke = blob("fluke", (0.09, R + 0.06, 0.03), (-L - 0.38, 0, 0.47), top, segs=16, rings=6)
    Tail = join("Tail", [stock, fluke], (-L + 0.08, 0, 0.46))
    assemble(Body, kids=[*fins, Tail])


def dolphin():
    _sea(C("#5f86a8"), C("#e9eef2"), (0.46, 0.26), rostrum=True)


def whale():
    _sea(C("#2f63c7"), C("#dfe9fb"), (0.50, 0.40), rostrum=False, grooves=True)


def butterfly():
    body = blob("body", (0.25, 0.06, 0.06), (0, 0, 0.62), INK, segs=12, rings=8)
    H = Vector((0.29, 0, 0.66))
    head = blob("head", (0.12, 0.13, 0.12), H, INK, segs=14, rings=10)
    ant = []
    for s in (1, -1):
        ant.append(cone(f"ant{s}", H + Vector((0.03, 0.05 * s, 0.08)), H + Vector((0.16, 0.12 * s, 0.32)), 0.012, INK, segs=5))
        ant.append(blob(f"knob{s}", (0.03, 0.03, 0.03), H + Vector((0.16, 0.12 * s, 0.33)), INK, segs=8, rings=5))
    Body = join("Body", [body, head, *ant, *eyes(H, 0.09, 0.07, 0.03, r=0.045, iris=C("#2b2b40"))], (0, 0, 0.62))
    wings = []
    for nm, s in (("WingL", 1), ("WingR", -1)):
        def wc(c, cy=0.32 * s):
            d = math.hypot((c.x - 0.04) / 0.30, (c.y - cy) / 0.36)
            return INK if d > 0.78 else (C("#7fd3ff") if d < 0.35 else C("#2a7be4"))
        up = blob(nm + "up", (0.26, 0.34, 0.015), (0.06, 0.33 * s, 0.62), wc, segs=18, rings=8)
        lo = blob(nm + "lo", (0.19, 0.24, 0.015), (-0.15, 0.24 * s, 0.62),
                  lambda c, s=s: INK if math.hypot((c.x + 0.15) / 0.19, (c.y - 0.24 * s) / 0.24) > 0.75 else C("#2a7be4"),
                  segs=16, rings=8)
        spots = [blob(f"{nm}sp{i}", (0.03, 0.03, 0.017), (0.18 - 0.08 * i, (0.52 + 0.04 * i) * s, 0.62), WHITE, segs=8, rings=4) for i in (0, 1)]
        wings.append(join(nm, [up, lo, *spots], (0, 0.04 * s, 0.62)))
    assemble(Body, kids=wings)


def octopus():
    pink, pale = C("#e0619b"), C("#f3a6c8")
    mantle = blob("mantle", (0.40, 0.40, 0.44), (0, 0, 0.78),
                  lambda c: pale if math.sin(c.x * 22) * math.sin(c.y * 22) > 0.7 else pink, segs=24, rings=14)
    H = Vector((0, 0, 0.72))
    parts = [mantle, *eyes(H, 0.33, 0.15, 0.0, r=0.08)]
    Body = join("Body", parts, (0, 0, 0.0))
    arms = []
    for i in range(8):
        a = (i + 0.5) / 8 * 2 * math.pi
        d = Vector((math.cos(a), math.sin(a), 0))
        # overlapping blobs make one smooth tentacle that tapers and curls up at the tip
        path = [(0.20, 0.36, 0.11), (0.28, 0.24, 0.10), (0.36, 0.14, 0.09), (0.45, 0.08, 0.075), (0.53, 0.07, 0.06),
                (0.59, 0.11, 0.05), (0.62, 0.17, 0.04)]
        segs = [blob(f"Arm{i}s{k}", (r, r, r), d * out + Vector((0, 0, z)), pink if k < 5 else pale, segs=8, rings=6)
                for k, (out, z, r) in enumerate(path)]
        arms.append(join(f"Arm{i}", segs, tuple(d * 0.18 + Vector((0, 0, 0.42)))))
    assemble(Body, kids=arms)


def hedgehog():
    brown, cream = C("#6b4a32"), C("#ecd3ad")
    body = blob("body", (0.46, 0.38, 0.33), (0, 0, 0.36), lambda c: cream if c.z < 0.22 or c.x > 0.34 else brown, segs=24, rings=12)
    spines = []
    k = 0
    for ring in range(5):
        el = math.radians(15 + ring * 17)
        n = 7 + ring
        for j in range(n):
            az = math.radians(110 + 140 * (j + 0.5 * (ring % 2)) / n)
            nrm = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
            nrm = Vector((nrm.x * 1.0, nrm.y, nrm.z))
            base = Vector((0, 0, 0.36)) + Vector((nrm.x * 0.40, nrm.y * 0.33, nrm.z * 0.28))
            tip = base + nrm * 0.22
            spines.append(cone(f"sp{k}", base, tip, 0.06, lambda c, b=base: C("#efe0c8") if (c - b).length > 0.13 else C("#4a3424"), segs=5))
            k += 1
    Body = join("Body", [body, *spines], (0, 0, 0.30))
    H = Vector((0.40, 0, 0.42))
    head = blob("head", (0.26, 0.28, 0.25), H, cream, segs=20, rings=12)
    snout = cone("snout", H + Vector((0.12, 0, -0.04)), H + Vector((0.36, 0, -0.08)), 0.11, cream, segs=10)
    nose = blob("nose", (0.04, 0.045, 0.04), H + Vector((0.36, 0, -0.08)), INK, segs=8, rings=6)
    ears = [blob(f"ear{s}", (0.04, 0.06, 0.06), H + Vector((-0.04, 0.18 * s, 0.18)), C("#c79a6c"), segs=8, rings=6) for s in (1, -1)]
    Head = join("Head", [head, snout, nose, *ears, *eyes(H, 0.19, 0.12, 0.05, r=0.055)], (0.30, 0, 0.34))
    legs = legs4(0.20, -0.20, 0.16, 0.08, C("#4a3424"), top=0.30, hip=0.24)
    assemble(Body, Head, ground=legs)


def lizard():
    green, dark, belly = C("#5fbf4a"), C("#3d8f33"), C("#d9e88a")
    bodyc = lambda c: belly if c.z < 0.17 else (dark if math.sin(c.x * 20) * math.sin(c.y * 25) > 0.6 else green)
    body = blob("body", (0.40, 0.22, 0.16), (0, 0, 0.26), bodyc, segs=24, rings=12)
    Body = join("Body", [body], (0, 0, 0.26))
    H = Vector((0.46, 0, 0.33))
    head = blob("head", (0.27, 0.26, 0.19), H, lambda c: belly if c.z < H.z - 0.08 else green, segs=20, rings=12)
    bumps = []
    for s in (1, -1):   # eyes that bulge up on top of the head, like a gecko's
        c = H + Vector((0.08, 0.15 * s, 0.11))
        bumps.append(blob(f"bump{s}", (0.08, 0.08, 0.07), c, green, segs=10, rings=6))
        bumps.append(blob(f"eye{s}", (0.055, 0.065, 0.06), c + Vector((0.04, 0.0, 0.025)), INK, segs=10, rings=6))
        bumps.append(blob(f"gl{s}", (0.02, 0.022, 0.022), c + Vector((0.08, 0.012 * s, 0.06)), GLINT, segs=6, rings=4))
    smile = blob("smile", (0.02, 0.18, 0.01), H + Vector((0.25, 0, -0.06)), C("#2e6b27"), segs=12, rings=4)
    Head = join("Head", [head, *bumps, smile], (0.30, 0, 0.28))
    tail = cone("tail", (-0.30, 0, 0.26), (-0.95, 0, 0.12), 0.15, bodyc, segs=12)
    Tail = join("Tail", [tail], (-0.32, 0, 0.26))
    legs = []
    for nm, x, s in (("LegFL", 0.22, 1), ("LegFR", 0.22, -1), ("LegBL", -0.22, 1), ("LegBR", -0.22, -1)):
        upper = blob(nm, (0.07, 0.15, 0.06), (x, 0.24 * s, 0.17), green, segs=10, rings=6)   # legs splay out to the side
        foot = blob(nm + "f", (0.09, 0.08, 0.035), (x + 0.04, 0.34 * s, 0.035), green, segs=10, rings=6)
        shin = blob(nm + "s", (0.05, 0.05, 0.09), (x + 0.02, 0.33 * s, 0.10), green, segs=8, rings=6)
        legs.append(join(nm, [upper, shin, foot], (x, 0.18 * s, 0.22)))
    assemble(Body, Head, kids=[Tail], ground=legs)


ANIMALS = {"fox": fox, "panda": panda, "turtle": turtle, "owl": owl, "dolphin": dolphin, "butterfly": butterfly,
           "tiger": tiger, "parrot": parrot, "octopus": octopus, "hedgehog": hedgehog, "whale": whale, "lizard": lizard}

if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    os.makedirs(OUT, exist_ok=True)
    for name in args or ANIMALS:
        reset()
        ANIMALS[name]()
        tris = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == "MESH" for p in o.data.polygons)
        path = os.path.abspath(os.path.join(OUT, name + ".glb"))
        bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_texcoords=False, export_normals=True,
                                  export_animations=False, export_vertex_color="MATERIAL", export_yup=True)
        print(f"{name}: {tris} triangles, {os.path.getsize(path)} bytes")
