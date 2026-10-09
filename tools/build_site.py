"""Publish a self-contained page so cached CSS/JS cannot mix release versions."""
from pathlib import Path
import hashlib
import shutil

root = Path(__file__).resolve().parent.parent
output = root / '_site'
output.mkdir(exist_ok=True)
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'style.css').read_text(encoding='utf-8')
js = (root / 'app.js').read_text(encoding='utf-8')
style_link = '<link rel="stylesheet" href="style.css">'
script_link = '<script src="app.js" defer></script>'
assert html.count(style_link) == 1 and html.count(script_link) == 1
assert '</style' not in css.lower() and '</script' not in js.lower()
html = html.replace(style_link, '<style>\n' + css + '\n</style>')
html = html.replace(script_link, '')
html = html.replace('</body>', '<script>\n' + js + '\n</script>\n</body>')
(output / 'index.html').write_text(html, encoding='utf-8')
shutil.copy2(root / 'manifest.webmanifest', output / 'manifest.webmanifest')
shutil.copytree(root / 'icons', output / 'icons', dirs_exist_ok=True)
worker = (root / 'sw.js').read_text(encoding='utf-8')
version = hashlib.sha256((html + worker).encode('utf-8')).hexdigest()[:12]
(output / 'sw.js').write_text(worker.replace('__VERSION__', version), encoding='utf-8')
print('Built self-contained index.html:', len(html.encode('utf-8')), 'bytes')
