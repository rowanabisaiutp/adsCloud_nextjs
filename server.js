const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const db = require('./lib/db');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

(async () => {
  await db.init();
  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  // Emisores de eventos en tiempo real
  const emitter = {
    // Broadcast todos los anuncios activos
    all: () => {
      const ads = db.getActiveAds();
      console.log('[WS] ads_update:', ads.length);
      io.emit('ads_update', { ads });
    },
    // Anuncio creado
    created: (ad) => {
      console.log('[WS] ad_created:', ad.id);
      io.emit('ad_created', { ad });
      emitter.all();
    },
    // Anuncio actualizado
    updated: (ad) => {
      console.log('[WS] ad_updated:', ad.id);
      io.emit('ad_updated', { ad });
      emitter.all();
    },
    // Anuncio eliminado
    deleted: (id) => {
      console.log('[WS] ad_deleted:', id);
      io.emit('ad_deleted', { id: Number(id) });
      emitter.all();
    },
    // Notificación push
    notify: (data, broadcast = true) => {
      console.log('[WS] notification:', data.title);
      if (broadcast) io.emit('notification', data);
    }
  };

  io.on('connection', (socket) => {
    console.log('[WS] Conectado:', socket.id);
    socket.emit('ads_update', { ads: db.getActiveAds() });

    socket.on('get_ads', () => socket.emit('ads_update', { ads: db.getActiveAds() }));
    socket.on('ad_click', ({ adId }) => {
      db.incrementClicks(adId);
      io.emit('ad_click', { id: adId, clicks: db.getById(adId)?.clicks || 0 });
    });
    socket.on('push_notification', (n) => emitter.notify(n, n.target === 'all'));
    socket.on('disconnect', () => console.log('[WS] Desconectado:', socket.id));
  });

  // Exponer globalmente para las rutas API
  global.io = io;
  global.ws = emitter;

  server.listen(port, () => {
    console.log(`🚀 Servidor: http://${hostname}:${port}`);
  });
})();
