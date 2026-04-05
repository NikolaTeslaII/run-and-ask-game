/**
 * API: /api/scores  
 * GET  → Top 100 điểm cao nhất (từ JSONBin.io)
 * POST → Lưu điểm mới, giữ top 100
 *
 * Storage: JSONBin.io (persistent, miễn phí)
 * Env variables cần cấu hình trên Vercel:
 *   JSONBIN_MASTER_KEY  = $2a$10$bsx/...
 *   JSONBIN_BIN_ID      = 69d2715136566621a87f7cd5
 */

const BIN_API = 'https://api.jsonbin.io/v3/b';

async function readScores() {
    const key = process.env.JSONBIN_MASTER_KEY;
    const bin = process.env.JSONBIN_BIN_ID;
    if (!key || !bin) return [];

    try {
        const res = await fetch(`${BIN_API}/${bin}/latest`, {
            headers: { 'X-Master-Key': key }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const records = data.record;
        // Lọc bỏ entry init placeholder
        if (!Array.isArray(records)) return [];
        return records.filter(r => !r.init);
    } catch (e) {
        console.error('[JSONBin READ]', e.message);
        return [];
    }
}

async function writeScores(scores) {
    const key = process.env.JSONBIN_MASTER_KEY;
    const bin = process.env.JSONBIN_BIN_ID;
    if (!key || !bin) return false;

    try {
        const res = await fetch(`${BIN_API}/${bin}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': key
            },
            body: JSON.stringify(scores)
        });
        return res.ok;
    } catch (e) {
        console.error('[JSONBin WRITE]', e.message);
        return false;
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── GET: Lấy top 100 ──
    if (req.method === 'GET') {
        const scores = await readScores();
        return res.status(200).json(scores);
    }

    // ── POST: Lưu điểm mới ──
    if (req.method === 'POST') {
        let bodyData = '';
        req.on('data', chunk => {
            bodyData += chunk.toString();
        });
        
        req.on('end', async () => {
            let body = {};
            try { body = bodyData ? JSON.parse(bodyData) : (req.body || {}); } catch (_) {}

            if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
                return res.status(400).json({ error: 'Body không hợp lệ hoặc rỗng' });
            }

            const name = String(body.name || 'Người hùng').substring(0, 15).trim();
            const score = Number(body.score) || 0;
            const stats = body.stats || {};
            const date = new Date().toLocaleDateString('vi-VN');

            const scores = await readScores();
            scores.push({ name, score, stats, date });
            scores.sort((a, b) => b.score - a.score);
            const top100 = scores.slice(0, 100);

            await writeScores(top100);

            const rank = top100.findIndex(s => s.name === name && s.score === score) + 1;
            return res.status(200).json({ ok: true, rank, total: top100.length });
        });
        return; // Đợi callback stream end
    }

    // Nếu là method khác GET/POST/OPTIONS
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
};
