# Builds DriveGo's sub-pages from the team's design (the claude.ai artifact's files, saved in one folder): Test Drive,
# the privacy policy and the articles, with the shared header and footer (sub.css, sub.js) and the Test Drive pictures.
# docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง" (owner 2026-11-18).
#
#   python3 -I tools/subpages-from-design.py <design folder> server/site
#
# The design folder holds site.css, site.js, testdrive.html, privacy.html, articles.html and tour/*.webp, as the
# Artifact tool saves them. They are someone else's: keep them in their own folder, run with -I, and read the design's
# code before using it (no network calls, no eval). What changes from the design:
# - the pages' Content-Security-Policy allows no inline scripts or styles: each page's <style> and <script> become
#   /site/<page>.css and /site/<page>.js, style="" in the scripts' markup becomes data-css set through CSSOM (DG.css);
# - Thai and English only (owner 2026-11-17): no CN button, no Chinese font;
# - links to the system's own addresses (/, /#contact, /login, /testdrive, /articles, /privacy, /site/tour/…);
# - Test Drive steps the system does not do yet carry the "เร็ว ๆ นี้" tag (owner 2026-11-18), as on the landing page.
# Each replacement must match exactly once: a design that changed one of these texts stops the build.
import sys, re, os, shutil
src, out = sys.argv[1], sys.argv[2]
read = lambda f: open(os.path.join(src, f), encoding='utf-8').read()
def write(f, s):
    with open(os.path.join(out, f), 'w', encoding='utf-8') as h: h.write(s)
def rep(text, a, b, count=1):
    n = text.count(a)
    assert n == count, (a[:80], n)
    return text.replace(a, b)

LINKS = [('index.html#contact', '/#contact'), ('index.html#eco', '/#eco'), ('index.html#plans', '/#plans'),
         ('href="index.html"', 'href="/"'), ('login.html', '/login'), ('testdrive.html', '/testdrive'),
         ('articles.html', '/articles'), ('privacy.html', '/privacy')]
def links(s):
    for a, b in LINKS: s = s.replace(a, b)
    assert 'index.html' not in s and '.html' not in s.replace('text/html', ''), 'a design link left unmapped'
    return s

# Shared header and footer.
js = read('site.js')
js = rep(js, "/* Shared header, footer, language switch and garage drawing for the DriveGo X sub-pages. */",
         "/* Shared header, footer, language switch and garage drawing for DriveGo's sub-pages (Test Drive, privacy, articles):\n"
         "   the team's design, built by tools/subpages-from-design.py. Thai and English. */")
js = re.sub(r"\n    zh:\{[^\n]*\}\n", "\n", js)
assert 'zh:{' not in js
js = rep(js, ",\n    en:{", ",\n    en:{")
js = rep(js, "[['th','TH'],['en','EN'],['zh','CN']]", "[['th','TH'],['en','EN']]")
js = rep(js, "window.DG={get lang(){return lang},",
         "window.DG={get lang(){return lang},\n"
         "    // The pages' CSP allows no style=\"\" in markup: data-css=\"prop:value;…\" is set through CSSOM instead.\n"
         "    css(r=document){r.querySelectorAll('[data-css]').forEach(e=>{for(const d of e.dataset.css.split(';')){const i=d.indexOf(':');if(i>0)e.style.setProperty(d.slice(0,i).trim(),d.slice(i+1).trim())}})},")
write('sub.js', links(js))
css = read('site.css')
css = rep(css, "/* Shared styles for the DriveGo X sub-pages (articles, login). Sizes in rem; 1px only for hairlines. */",
          "/* Shared styles for DriveGo's sub-pages (Test Drive, privacy, articles): the team's design, built by\n"
          "   tools/subpages-from-design.py. Sizes in rem; 1px only for hairlines. */")
css += """
/* DriveGo additions: what the design had inline (the pages' CSP allows no inline styles), and the "coming soon" tag */
.sprite{position:absolute;width:0;height:0;overflow:hidden}
span.coming.coming{display:inline-block;width:auto;margin:0 0 0 .35em;padding:0 .6em;border:1px solid rgba(251,191,36,.55);
  border-radius:62rem;background:rgba(245,158,11,.1);color:var(--glow);font-size:.72rem;font-weight:600;line-height:1.7;
  letter-spacing:0;text-transform:none;white-space:nowrap;vertical-align:.1em}
"""
write('sub.css', css)

FONTS = ('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800'
         '&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap')
SOON = ['x-prox-book', 'x-prox-inq', 'x-prox-sos', 'x-prox-coins', 'x-prox-shop', 'x-stock-px',
        'x-techroom-prox', 'x-techroom-pub', 'x-techroom-prv']

def page(name, fix):
    s = read(name + '.html')
    title = re.search(r'<title>([^<]*)</title>', s).group(1)
    styles = re.findall(r'<style>(.*?)</style>', s, re.S)
    scripts = re.findall(r'<script>(.*?)</script>', s, re.S)
    assert len(styles) == 1 and len(scripts) == 1, name
    body = s[s.index('<body'):s.rindex('</body>')]
    body = re.sub(r'<script[^>]*>.*?</script>\s*', '', body, flags=re.S)
    body = body.replace('<svg width="0" height="0" style="position:absolute" aria-hidden="true">',
                        '<svg class="sprite" width="0" height="0" aria-hidden="true">')
    assert ' style="' not in body, name
    code = fix(scripts[0].replace(' style="', ' data-css="'))
    write(name + '.css', f"/* {name}: the team's design, built by tools/subpages-from-design.py */\n" + styles[0].strip() + '\n')
    write(name + '.js', f"// {name}: the team's design, built by tools/subpages-from-design.py (texts in Thai and English are\n"
                        "// shown; the Chinese ones are unused).\n(() => {\n" + links(code).strip() + '\n})();\n')
    write(name + '.html', f"""<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="icon" href="/site/logo.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/site/sub.css">
<link rel="stylesheet" href="/site/{name}.css">
<script src="/site/sub.js" defer></script>
<script src="/site/{name}.js" defer></script>
</head>
{links(body).strip()}
</body>
</html>
""")

def testdrive(c):
    for k in SOON: c = rep(c, f"\n'{k}':[", f"\n'{k}':[")
    c = rep(c, "const cap=id=>{const c=CAP[id],o={th:0,en:2,zh:4}[DG.lang];return {t:c[o],d:c[o+1]}};",
            "// What the system does not do yet carries the \"coming soon\" tag (owner 2026-11-18): these ProX steps, and the\n"
            "// whole of DriveGo BOOK and DriveGo Admin.\n"
            f"const SOON=new Set({SOON!r});\n"
            "const soon=()=>` <span class=\"coming\">${DG.lang==='en'?'Coming soon':'เร็ว ๆ นี้'}</span>`;\n"
            "const cap=id=>{const c=CAP[id],o={th:0,en:2,zh:4}[DG.lang];return {t:c[o],d:c[o+1],soon:SOON.has(id)||!id.startsWith('x-')}};")
    c = rep(c, 'aria-selected="${s[0]===sys}">${s[1]}<small>', 'aria-selected="${s[0]===sys}">${s[1]}${s[0]===\'prox\'?\'\':soon()}<small>')
    c = rep(c, '<span>${cap(id).t}</span></a>', '<span>${cap(id).t}${cap(id).soon?soon():\'\'}</span></a>')
    c = rep(c, '<h2>${c.t}</h2>', '<h2>${c.t}${c.soon?soon():\'\'}</h2>')
    c = rep(c, "  const nx=list[i+1];", "  DG.css($('#step'));\n  const nx=list[i+1];")
    c = rep(c, 'src="tour/${cur}.webp"', 'src="/site/tour/${cur}.webp"')
    c = rep(c, "'tour/'+", "'/site/tour/'+", 2)
    assert "tour/" not in c.replace('/site/tour/', ''), 'a picture address left unmapped'
    return c

def privacy(c):
    return c

def articles(c):
    c = rep(c, "</span></a>`).join('');\n}\nfunction read(a){", "</span></a>`).join('');\n  DG.css($('#grid'));\n}\nfunction read(a){")
    return c

# The sign-in page (/login): only the design's styles are taken as they are (login.css). Its markup and script are
# DriveGo's own (server/site/login.html, login.js), merged by hand from the design's login.html like the landing page:
# the design's cards open the shop's sign-in form in the card picked (owner 2026-11-17), which the design does not have.
s = read('login.html')
styles = re.findall(r'<style>(.*?)</style>', s, re.S)
assert len(styles) == 1
write('login.css', "/* The sign-in page (/login): the team's design, built by tools/subpages-from-design.py, then DriveGo's sign-in form */\n"
      + styles[0].strip() + '\n' + open(os.path.join(out, 'login-form.css'), encoding='utf-8').read())

page('testdrive', testdrive)
page('privacy', privacy)
page('articles', articles)
os.makedirs(os.path.join(out, 'tour'), exist_ok=True)
n = 0
for f in sorted(os.listdir(os.path.join(src, 'tour'))):
    assert re.fullmatch(r'[a-z]+(-[a-z]+)*\.webp', f), f
    b = open(os.path.join(src, 'tour', f), 'rb').read()
    assert b[:4] == b'RIFF' and b[8:12] == b'WEBP', f
    shutil.copyfile(os.path.join(src, 'tour', f), os.path.join(out, 'tour', f)); n += 1
print('ok', n, 'pictures')
