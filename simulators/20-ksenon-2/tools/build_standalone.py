#!/usr/bin/env python3
"""Сборка автономного ksenon2_simulator_standalone.html из ksenon2_simulator.html + data/ + assets/."""
import re, base64, sys, os
root = sys.argv[1]; out = sys.argv[2]
def rd(p): return open(os.path.join(root,p),encoding='utf-8').read()
def b64(p): return base64.b64encode(open(os.path.join(root,p),'rb').read()).decode()
html = rd('ksenon2_simulator.html')
def css(m):
    c = rd(m.group(1))
    c = c.replace('url(webfonts/fa-solid-900.woff2)','url(data:font/woff2;base64,'+b64('assets/webfonts/fa-solid-900.woff2')+')')
    return '<style>'+c+'</style>'
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
html = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>'+rd(m.group(1)).rstrip()+'\n</script>', html)
html = re.sub(r'src="(assets/img/[^"]+\.webp)"', lambda m: 'src="data:image/webp;base64,'+b64(m.group(1))+'"', html)
open(out,'w',encoding='utf-8').write(html)
print('ok',len(html))
