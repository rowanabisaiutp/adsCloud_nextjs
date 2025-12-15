// SDK Widget para integrar anuncios en otras aplicaciones
(function() {
  const script = document.currentScript;
  const serverUrl = script.dataset.server || 'ws://localhost:3000';
  const containerId = script.dataset.container || 'ad-container';
  const adType = script.dataset.type || 'banner';

  const styles = `
    .ad-widget { font-family: system-ui, sans-serif; }
    .ad-widget-banner { padding: 10px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 8px; text-align: center; }
    .ad-widget-banner img { max-width: 100%; border-radius: 4px; }
    .ad-widget-banner a { color: #00d4aa; text-decoration: none; }
    .ad-widget-sidebar { display: flex; flex-direction: column; gap: 8px; }
    .ad-widget-popup { position: fixed; bottom: 20px; right: 20px; max-width: 300px; background: #1a1a2e; border-radius: 8px; padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .ad-widget-popup .close { position: absolute; top: 5px; right: 10px; cursor: pointer; color: #888; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const container = document.getElementById(containerId);
  if (!container) return console.error('Ad container not found:', containerId);

  const socket = new WebSocket(serverUrl.replace('http', 'ws'));
  
  socket.onmessage = (e) => {
    const { type, ads } = JSON.parse(e.data);
    if (type === 'ads_update') renderAds(ads.filter(a => a.type === adType));
  };

  socket.onopen = () => socket.send(JSON.stringify({ type: 'get_ads' }));

  function renderAds(ads) {
    if (!ads.length) return;
    container.innerHTML = ads.map(ad => `
      <div class="ad-widget ad-widget-${adType}" data-id="${ad.id}">
        ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.title}">` : ''}
        <a href="${ad.link_url}" target="_blank">${ad.title}</a>
        ${adType === 'popup' ? '<span class="close" onclick="this.parentElement.remove()">✕</span>' : ''}
      </div>
    `).join('');

    container.querySelectorAll('.ad-widget a').forEach(a => {
      a.onclick = (e) => {
        const id = a.closest('.ad-widget').dataset.id;
        socket.send(JSON.stringify({ type: 'ad_click', adId: parseInt(id) }));
      };
    });
  }
})();

