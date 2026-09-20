#!/usr/bin/env python3
"""Stamp every /assets/*.css and /assets/*.js reference in the HTML pages with a
short content hash, so a deploy never pairs new HTML with a browser's cached
old stylesheet or script. Run before committing:  python3 stamp.py
"""
import hashlib, io, re, glob, os

def digest(path):
    return hashlib.md5(open(path, "rb").read()).hexdigest()[:8]

stamps = {os.path.basename(p): digest(p) for p in glob.glob("assets/*.css") + glob.glob("assets/*.js")}
pat = re.compile(r'(/assets/(site\.css|follow\.js))(\?v=[0-9a-f]+)?')
for page in ["index.html"] + glob.glob("*/index.html"):
    t = io.open(page, encoding="utf-8").read()
    new = pat.sub(lambda m: "%s?v=%s" % (m.group(1), stamps[m.group(2)]), t)
    if new != t:
        io.open(page, "w", encoding="utf-8").write(new)
    print("%-26s %s" % (page, "stamped" if new != t else "unchanged"))
print("stamps:", stamps)
