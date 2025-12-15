const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "ads.db");
let db = null;
let SQL = null;

async function init() {
  if (db) return db;
  SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      image_url TEXT,
      link_url TEXT,
      type TEXT DEFAULT 'banner',
      is_active INTEGER DEFAULT 1,
      clicks INTEGER DEFAULT 0,
      options TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Agregar columna options si no existe
  try {
    db.run("ALTER TABLE ads ADD COLUMN options TEXT");
  } catch (e) {}
  
  save();
  return db;
}

function save() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function reload() {
  if (SQL && fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  }
}

function query(sql, params = []) {
  reload();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

// Parsear options JSON al leer
function parseAd(ad) {
  if (!ad) return ad;
  if (ad.options && typeof ad.options === 'string') {
    try { ad.options = JSON.parse(ad.options); } catch (e) { ad.options = {}; }
  }
  return ad;
}

function parseAds(ads) {
  return ads.map(parseAd);
}

module.exports = {
  init,
  getAll: () => parseAds(query("SELECT * FROM ads ORDER BY created_at DESC")),
  getActiveAds: () => parseAds(query("SELECT * FROM ads WHERE is_active = 1 ORDER BY created_at DESC")),
  getById: (id) => parseAd(query("SELECT * FROM ads WHERE id = ?", [id])[0]),

  create: ({ title, content, image_url, link_url, type, options }) => {
    const optionsJson = options ? JSON.stringify(options) : null;
    run("INSERT INTO ads (title, content, image_url, link_url, type, options) VALUES (?, ?, ?, ?, ?, ?)",
      [title, content || "", image_url || "", link_url || "", type || "banner", optionsJson]);
    const result = query("SELECT last_insert_rowid() as id");
    const id = result[0]?.id || 0;
    return { id, title, content, image_url, link_url, type, options, is_active: 1, clicks: 0 };
  },

  update: (id, { title, content, image_url, link_url, type, is_active, options }) => {
    const optionsJson = options ? JSON.stringify(options) : null;
    run(`UPDATE ads SET title = ?, content = ?, image_url = ?, link_url = ?, type = ?, is_active = ?, options = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, content, image_url, link_url, type, is_active ? 1 : 0, optionsJson, id]);
    return module.exports.getById(id);
  },

  delete: (id) => run("DELETE FROM ads WHERE id = ?", [id]),
  incrementClicks: (id) => run("UPDATE ads SET clicks = clicks + 1 WHERE id = ?", [id]),
};
