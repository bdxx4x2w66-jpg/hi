"""Prepare assets for the page: build/story.js (timeline + voice cues) and
build/fonts (Google Fonts subset to exactly the characters the film uses)."""
import glob, json, os, re, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, "build")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36"


def story_js():
    story = json.load(open(os.path.join(ROOT, "story.json")))
    cues_path = os.path.join(B, "voice", "cues.json")
    durs = {(c["shot"], c["idx"]): c["dur"] for c in json.load(open(cues_path))} if os.path.exists(cues_path) else {}
    for s in story["shots"]:
        for i, c in enumerate(s["cues"]):
            c["dur"] = durs.get((s["id"], i), 2.0)
    os.makedirs(B, exist_ok=True)
    open(os.path.join(B, "story.js"), "w").write("const STORY = " + json.dumps(story, ensure_ascii=False) + ";\n")


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})).read()


def fonts():
    src = open(os.path.join(ROOT, "story.json")).read()
    for f in glob.glob(os.path.join(ROOT, "video", "**", "*.js"), recursive=True):
        src += open(f).read()
    chars = "".join(sorted(set(c for c in src if ord(c) > 127) | set(chr(i) for i in range(32, 127))))
    out = os.path.join(B, "fonts"); os.makedirs(out, exist_ok=True)
    css_all = ""
    for fam, wg in [("Noto Serif SC", "600;900"), ("JetBrains Mono", "400;700")]:
        url = "https://fonts.googleapis.com/css2?family=" + fam.replace(" ", "+") + ":wght@" + wg + \
              "&text=" + urllib.parse.quote(chars) + "&display=block"
        css = fetch(url).decode()
        for i, u in enumerate(re.findall(r"url\((https://[^)]+)\)", css)):
            name = f"{fam.replace(' ', '')}_{i}.woff2"
            open(os.path.join(out, name), "wb").write(fetch(u))
            css = css.replace(u, name)
        css_all += css
    open(os.path.join(out, "fonts.css"), "w").write(css_all)
    print("fonts:", len(chars), "chars")


if __name__ == "__main__":
    story_js()
    fonts()
