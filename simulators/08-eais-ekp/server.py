#!/usr/bin/env python3
"""Сервер сайта АДИС «Папилон»: статика + REST API + SQLite. Только стандартная библиотека Python 3.8+.
Запуск: python3 server.py [порт]   (по умолчанию 8080). Переменная PAPILON_ADMIN_KEY защищает страницу результатов."""
import json, os, sqlite3, sys, hashlib, threading
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(ROOT, 'db', 'papilon.sqlite')
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import build_db
if not os.path.exists(DB_PATH): build_db.build(ROOT)
ADMIN_KEY = os.environ.get('PAPILON_ADMIN_KEY', '')
LOCK = threading.Lock()
HIDDEN = ('/db', '/tools', '/server.py', '/start.sh', '/start.bat', '/README.md')

def conn():
    c = sqlite3.connect(DB_PATH); c.row_factory = sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c

def ref_data():
    c = conn()
    ten = [{'id': r['id'], 'name': r['name'], 'dob': r['dob'], 'dobDisplay': r['dob_display'], 'gender': r['gender'],
            'region': r['region'], 'crimes': json.loads(r['crimes']), 'photo': r['photo'], 'fingers': json.loads(r['fingers']),
            'pattern': r['pattern'], 'arrested': bool(r['arrested']), 'crimHist': r['crim_hist']}
           for r in c.execute('SELECT * FROM tenprints ORDER BY id')]
    lat = [{'id': r['id'], 'kusp': r['kusp'], 'date': r['date'], 'place': r['place'], 'type': r['type'], 'quality': r['quality'],
            'fragment': bool(r['fragment']), 'trueMatch': r['true_match'], 'fingerIndex': r['finger_index'], 'status': r['status'],
            'userMinutiae': [], 'aiMinutiae': []} for r in c.execute('SELECT * FROM latents ORDER BY id')]
    mis = [json.loads(r['body']) for r in c.execute('SELECT body FROM missions ORDER BY id')]
    men = {r['keyword']: r['answer'] for r in c.execute('SELECT keyword, answer FROM mentor_responses ORDER BY ord')}
    masks = json.loads(c.execute('SELECT body FROM fp_masks WHERE id=1').fetchone()['body'])
    minu = json.loads(c.execute('SELECT body FROM fp_minutiae WHERE id=1').fetchone()['body'])
    c.close()
    return {'tenprints': ten, 'latents': lat, 'missions': mis, 'mentor': men, 'fpMasks': masks, 'fpMinutiae': minu}

def save_session(payload):
    user = payload.get('user') or {}
    name, squad = user.get('fullName') or '—', str(user.get('squad') or '')
    key = payload.get('cadetId') or hashlib.sha1((name + '|' + squad).lower().encode()).hexdigest()[:12]
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    with LOCK:
        c = conn()
        c.execute('INSERT INTO cadets VALUES (?,?,?,?,?) ON CONFLICT(cadet_key) DO UPDATE SET full_name=excluded.full_name, squad=excluded.squad, last_seen=excluded.last_seen',
                  (key, name, squad, now, now))
        c.execute('INSERT INTO sessions VALUES (?,?,?) ON CONFLICT(cadet_key) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at',
                  (key, json.dumps(payload, ensure_ascii=False), now))
        c.execute('DELETE FROM journal WHERE cadet_key=?', (key,))
        for arch, rows in ((0, payload.get('journal') or []), (1, payload.get('archive') or [])):
            c.executemany('INSERT INTO journal VALUES (?,?,?,?,?,?,?,?,?)', [
                (key, e.get('seq'), e.get('ts'), e.get('action'), e.get('detail'), e.get('caseId'), e.get('missionId'), e.get('module'), arch)
                for e in rows if isinstance(e, dict)])
        for mid, p in (payload.get('missionsProgress') or {}).items():
            if not isinstance(p, dict): continue
            c.execute('INSERT INTO mission_results VALUES (?,?,?,?,?,?) ON CONFLICT(cadet_key,mission_id) DO UPDATE SET score=excluded.score, done=excluded.done, attempts=excluded.attempts, completed_at=excluded.completed_at',
                      (key, int(mid), p.get('score'), 1 if p.get('done') else 0, p.get('attempts'), p.get('completedAt')))
        c.commit(); c.close()
    return key

def results():
    c = conn(); out = []
    for r in c.execute('SELECT * FROM cadets ORDER BY last_seen DESC'):
        m = [dict(x) for x in c.execute('SELECT mission_id, score, done, attempts, completed_at FROM mission_results WHERE cadet_key=? ORDER BY mission_id', (r['cadet_key'],))]
        n = c.execute('SELECT COUNT(*) FROM journal WHERE cadet_key=? AND archived=0', (r['cadet_key'],)).fetchone()[0]
        out.append({**dict(r), 'missions': m, 'actions': n})
    c.close(); return out

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=ROOT, **kw)
    def log_message(self, fmt, *args): pass
    def _json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code); self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(b))); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(b)
    def _admin_ok(self, q): return not ADMIN_KEY or q.get('key', [''])[0] == ADMIN_KEY
    def do_GET(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path == '/api/health': return self._json({'ok': True})
        if u.path == '/api/ref': return self._json(ref_data())
        if u.path == '/api/results':
            return self._json(results()) if self._admin_ok(q) else self._json({'error': 'forbidden'}, 403)
        if u.path.startswith('/api/'): return self._json({'error': 'not found'}, 404)
        if any(u.path == h or u.path.startswith(h + '/') for h in HIDDEN): return self.send_error(404)
        super().do_GET()
    def do_POST(self):
        u = urlparse(self.path)
        if u.path != '/api/session': return self._json({'error': 'not found'}, 404)
        n = int(self.headers.get('Content-Length') or 0)
        if n > 8 * 1024 * 1024: return self._json({'error': 'too large'}, 413)
        try: key = save_session(json.loads(self.rfile.read(n).decode('utf-8'))['payload'])
        except Exception as e: return self._json({'error': str(e)}, 400)
        self._json({'ok': True, 'cadetKey': key})

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f'АДИС «Папилон»: http://localhost:{port}/   (результаты: /results.html)   Ctrl+C — остановка')
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
