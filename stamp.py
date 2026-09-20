#!/usr/bin/env python3
"""Tag every versionable asset URL with a short content hash, so a deploy can
never serve new markup against a browser's cached old file. Run before
committing:  python3 stamp.py

Covers /assets/*.css, /assets/*.js, and the hero videos and posters in
/assets/hero/. Hero media is referenced from JavaScript rather than markup, so
the hashes are injected into the HERO_V map inside assets/hero.js.
"""
import hashlib, io, re, glob, os, json

def digest(path):
    return hashlib.md5(open(path, "rb").read()).hexdigest()[:8]

# 1. Hero media hashes go into hero.js first, so hero.js is hashed after it changes.
hero = {}
for p in sorted(glob.glob("assets/hero/hero_*.mp4")):
    name = os.path.basename(p)[len("hero_"):-len(".mp4")]
    hero[name] = digest(p)
if hero and os.path.exists("assets/hero.js"):
    t = io.open("assets/hero.js", encoding="utf-8").read()
    line = "  var HERO_V = %s; // stamped by stamp.py" % json.dumps(hero, sort_keys=True)
    new = re.sub(r"^  var HERO_V = .*$", line.replace("\\", "\\\\"), t, count=1, flags=re.M)
    if new != t:
        io.open("assets/hero.js", "w", encoding="utf-8").write(new)
    print("hero media:", hero)

# 2. Stamp asset URLs in every HTML page.
stamps = {}
for p in glob.glob("assets/*.css") + glob.glob("assets/*.js"):
    stamps["/" + p] = digest(p)
for p in glob.glob("assets/hero/*"):
    stamps["/" + p] = digest(p)

pat = re.compile(r'(/assets/(?:hero/)?[A-Za-z0-9_.-]+\.(?:css|js|mp4|jpg|png|webm))(\?v=[0-9a-f]+)?')
def sub(m):
    key = m.group(1)
    return key + ("?v=" + stamps[key] if key in stamps else (m.group(2) or ""))

for page in ["index.html"] + glob.glob("*/index.html"):
    t = io.open(page, encoding="utf-8").read()
    new = pat.sub(sub, t)
    if new != t:
        io.open(page, "w", encoding="utf-8").write(new)
    print("%-26s %s" % (page, "stamped" if new != t else "unchanged"))
