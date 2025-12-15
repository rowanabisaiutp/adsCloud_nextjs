'use client';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Megaphone, LayoutDashboard, FileText, BarChart3, Settings, 
  Plus, RefreshCw, Pencil, Trash2, X, Circle,
  Image, Link2, Eye, Palette, Type, MessageSquare, PanelRight,
  Save, Sparkles, TrendingUp, MousePointer, Activity, Clock,
  Server, Wifi, Database, Bell, Moon, Sun, Copy, ExternalLink,
  CheckCircle, AlertCircle, Calendar, Filter, Send, Users, Zap,
  ToggleLeft, MousePointerClick, ImageOff, FileX, Timer, Layers,
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Move
} from 'lucide-react';

const socket = typeof window !== 'undefined' ? io() : null;

export default function Home() {
  const [ads, setAds] = useState([]);
  const [connected, setConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editAd, setEditAd] = useState(null);
  const [view, setView] = useState('dashboard');
  const [config, setConfig] = useState({
    serverUrl: 'http://localhost:3000',
    wsPort: 3000,
    autoRefresh: true,
    darkMode: true,
    notifications: true
  });

  useEffect(() => {
    if (!socket) return;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('ads_update', ({ ads }) => setAds(ads));
    fetchAds();
    return () => { socket.off('ads_update'); };
  }, []);

  const fetchAds = async () => {
    const res = await fetch('/api/ads');
    setAds(await res.json());
  };

  const handleSubmit = async (data) => {
    const url = editAd ? `/api/ads/${editAd.id}` : '/api/ads';
    await fetch(url, {
      method: editAd ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    closeModal();
    fetchAds();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    fetchAds();
  };

  const toggleActive = async (ad) => {
    await fetch(`/api/ads/${ad.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ad, is_active: !ad.is_active })
    });
    fetchAds();
  };

  const openModal = (ad = null) => { setEditAd(ad); setShowModal(true); };
  const closeModal = () => { setEditAd(null); setShowModal(false); };

  const stats = {
    total: ads.length,
    active: ads.filter(a => a.is_active).length,
    inactive: ads.filter(a => !a.is_active).length,
    clicks: ads.reduce((sum, a) => sum + (a.clicks || 0), 0),
    banners: ads.filter(a => a.type === 'banner').length,
    popups: ads.filter(a => a.type === 'popup').length,
    sidebars: ads.filter(a => a.type === 'sidebar').length
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'ads', icon: FileText, label: 'Anuncios' },
    { id: 'notifications', icon: Bell, label: 'Notificaciones' },
    { id: 'stats', icon: BarChart3, label: 'Estadísticas' },
    { id: 'settings', icon: Settings, label: 'Configuración' }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Megaphone size={24} /> AdManager
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div 
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <item.icon size={18} /> {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          WebSocket Ads v1.0
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <h1 className="header-title">
            {navItems.find(n => n.id === view)?.label || 'Dashboard'}
          </h1>
          <div className="header-actions">
            <div className="status-badge">
              <span className={`status-dot ${connected ? 'connected' : ''}`}></span>
              {connected ? 'En línea' : 'Desconectado'}
            </div>
            {(view === 'dashboard' || view === 'ads') && (
              <button className="btn-primary" onClick={() => openModal()}>
                <Plus size={16} /> Nuevo Anuncio
              </button>
            )}
          </div>
        </header>

        <div className="content">
          {view === 'dashboard' && <DashboardView ads={ads} stats={stats} fetchAds={fetchAds} openModal={openModal} handleDelete={handleDelete} toggleActive={toggleActive} />}
          {view === 'ads' && <AdsView ads={ads} fetchAds={fetchAds} openModal={openModal} handleDelete={handleDelete} toggleActive={toggleActive} />}
          {view === 'notifications' && <NotificationsView socket={socket} connected={connected} />}
          {view === 'stats' && <StatsView ads={ads} stats={stats} />}
          {view === 'settings' && <SettingsView config={config} setConfig={setConfig} connected={connected} />}
        </div>
      </main>

      {showModal && <AdModal ad={editAd} onSubmit={handleSubmit} onClose={closeModal} />}
    </div>
  );
}

function DashboardView({ ads, stats, fetchAds, openModal, handleDelete, toggleActive }) {
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Anuncios</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activos</div>
          <div className="stat-value accent">{stats.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Clicks</div>
          <div className="stat-value">{stats.clicks}</div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">Anuncios recientes</span>
          <button className="btn-ghost" onClick={fetchAds}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
        <AdsTable ads={ads.slice(0, 5)} openModal={openModal} handleDelete={handleDelete} toggleActive={toggleActive} />
      </div>
    </>
  );
}

function AdsView({ ads, fetchAds, openModal, handleDelete, toggleActive }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = ads.filter(ad => {
    if (filter === 'active' && !ad.is_active) return false;
    if (filter === 'inactive' && ad.is_active) return false;
    if (filter === 'banner' && ad.type !== 'banner') return false;
    if (filter === 'popup' && ad.type !== 'popup') return false;
    if (filter === 'sidebar' && ad.type !== 'sidebar') return false;
    if (search && !ad.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="filters-bar">
        <div className="search-box">
          <input 
            className="form-input" 
            placeholder="Buscar anuncios..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Activos' },
            { id: 'inactive', label: 'Inactivos' },
            { id: 'banner', label: 'Banner' },
            { id: 'popup', label: 'Popup' },
            { id: 'sidebar', label: 'Sidebar' }
          ].map(f => (
            <button 
              key={f.id} 
              className={`filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="btn-ghost" onClick={fetchAds}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">{filtered.length} anuncios</span>
        </div>
        <AdsTable ads={filtered} openModal={openModal} handleDelete={handleDelete} toggleActive={toggleActive} />
      </div>
    </>
  );
}

function AdsTable({ ads, openModal, handleDelete, toggleActive }) {
  if (ads.length === 0) {
    return (
      <div className="empty-state">
        <Megaphone size={48} strokeWidth={1} />
        <div className="empty-text">No hay anuncios</div>
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Anuncio</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Clicks</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {ads.map(ad => (
          <tr key={ad.id}>
            <td>
              <div className="ad-title">{ad.title}</div>
              <div className="ad-content">{ad.content || 'Sin descripción'}</div>
            </td>
            <td><span className={`badge badge-${ad.type}`}>{ad.type}</span></td>
            <td>
              <span 
                className={`badge ${ad.is_active ? 'badge-active' : 'badge-inactive'}`}
                onClick={() => toggleActive(ad)}
                style={{ cursor: 'pointer' }}
              >
                {ad.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td className="clicks">{ad.clicks || 0}</td>
            <td>
              <div className="actions">
                <button className="btn-ghost btn-icon" onClick={() => openModal(ad)}><Pencil size={14} /></button>
                <button className="btn-danger btn-icon" onClick={() => handleDelete(ad.id)}><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatsView({ ads, stats }) {
  const maxClicks = Math.max(...ads.map(a => a.clicks || 0), 1);
  const activePercent = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  return (
    <>
      <div className="stats-grid stats-grid-4">
        <div className="stat-card">
          <div className="stat-icon"><FileText size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Anuncios</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accent"><CheckCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value accent">{stats.active}</div>
            <div className="stat-label">Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><AlertCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">Inactivos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><MousePointer size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.clicks}</div>
            <div className="stat-label">Total Clicks</div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3><TrendingUp size={16} /> Por Tipo</h3>
          </div>
          <div className="chart-bars">
            {[
              { label: 'Banner', value: stats.banners, type: 'banner' },
              { label: 'Popup', value: stats.popups, type: 'popup' },
              { label: 'Sidebar', value: stats.sidebars, type: 'sidebar' }
            ].map(item => (
              <div className="bar-item" key={item.type}>
                <div className="bar-label">{item.label}</div>
                <div className="bar-track">
                  <div className={`bar-fill ${item.type}`} style={{ width: `${(item.value / stats.total) * 100 || 0}%` }}></div>
                </div>
                <div className="bar-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3><Activity size={16} /> Estado</h3>
          </div>
          <div className="status-compact">
            <div className="progress-ring-small">
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" strokeWidth="3"
                  strokeDasharray={`${activePercent} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
              </svg>
              <span>{activePercent}%</span>
            </div>
            <div className="status-bars">
              <div className="status-bar-item">
                <span className="status-bar-label"><Circle size={8} fill="var(--accent)" stroke="none" /> Activos</span>
                <span className="status-bar-value">{stats.active}</span>
              </div>
              <div className="status-bar-item">
                <span className="status-bar-label"><Circle size={8} fill="var(--border)" stroke="none" /> Inactivos</span>
                <span className="status-bar-value">{stats.inactive}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3><MousePointer size={16} /> Top Clicks</h3>
        </div>
        <div className="top-list">
          {[...ads].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5).map((ad, i) => (
            <div className="top-item" key={ad.id}>
              <span className="top-rank">{i + 1}</span>
              <span className="top-name">{ad.title}</span>
              <div className="top-bar">
                <div className="top-fill" style={{ width: `${((ad.clicks || 0) / maxClicks) * 100}%` }}></div>
              </div>
              <span className="top-value">{ad.clicks || 0}</span>
            </div>
          ))}
          {ads.length === 0 && <div className="empty-text">Sin datos</div>}
        </div>
      </div>
    </>
  );
}

function NotificationsView({ socket, connected }) {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all' });
  const [sending, setSending] = useState(false);

  const sendNotification = () => {
    if (!form.title || !form.message) return;
    setSending(true);
    
    const notification = {
      id: Date.now(),
      ...form,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    if (socket && connected) {
      socket.emit('push_notification', notification);
    }
    
    setNotifications(prev => [notification, ...prev]);
    setForm({ title: '', message: '', type: 'info', target: 'all' });
    setSending(false);
  };

  const types = [
    { id: 'info', icon: Bell, label: 'Info', color: '#3b82f6' },
    { id: 'success', icon: CheckCircle, label: 'Éxito', color: '#10b981' },
    { id: 'warning', icon: AlertCircle, label: 'Alerta', color: '#f59e0b' },
    { id: 'promo', icon: Zap, label: 'Promo', color: '#8b5cf6' }
  ];

  return (
    <>
      <div className="notif-grid">
        <div className="notif-composer">
          <div className="card-header-alt">
            <Send size={18} /> Enviar Notificación
          </div>
          
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input 
              className="form-input" 
              value={form.title} 
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
              placeholder="Título de la notificación"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mensaje *</label>
            <textarea 
              className="form-input" 
              rows={3}
              value={form.message} 
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))} 
              placeholder="Escribe el mensaje..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo</label>
            <div className="notif-types">
              {types.map(t => (
                <div 
                  key={t.id}
                  className={`notif-type ${form.type === t.id ? 'active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, type: t.id }))}
                  style={{ '--type-color': t.color }}
                >
                  <t.icon size={16} />
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Destinatarios</label>
            <div className="target-selector">
              <div 
                className={`target-option ${form.target === 'all' ? 'active' : ''}`}
                onClick={() => setForm(p => ({ ...p, target: 'all' }))}
              >
                <Users size={16} /> Todos
              </div>
              <div 
                className={`target-option ${form.target === 'active' ? 'active' : ''}`}
                onClick={() => setForm(p => ({ ...p, target: 'active' }))}
              >
                <Wifi size={16} /> Conectados
              </div>
            </div>
          </div>

          <button 
            className="btn-primary btn-full" 
            onClick={sendNotification}
            disabled={!form.title || !form.message || sending || !connected}
          >
            <Send size={16} /> {sending ? 'Enviando...' : 'Enviar Notificación'}
          </button>

          {!connected && (
            <div className="notif-warning">
              <AlertCircle size={14} /> Desconectado del servidor
            </div>
          )}
        </div>

        <div className="notif-history">
          <div className="card-header-alt">
            <Clock size={18} /> Historial
          </div>
          
          {notifications.length === 0 ? (
            <div className="empty-state-sm">
              <Bell size={32} strokeWidth={1} />
              <span>Sin notificaciones enviadas</span>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map(n => (
                <div key={n.id} className={`notif-item notif-${n.type}`}>
                  <div className="notif-icon">
                    {types.find(t => t.id === n.type)?.icon && 
                      React.createElement(types.find(t => t.id === n.type).icon, { size: 16 })}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-meta">
                      <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                      <span className="notif-target">{n.target === 'all' ? 'Todos' : 'Conectados'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SettingsView({ config, setConfig, connected }) {
  const update = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

  return (
    <>
      <div className="settings-section">
        <div className="settings-header">
          <Server size={18} /> Conexión
        </div>
        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Estado del Servidor</div>
              <div className="setting-desc">Conexión WebSocket</div>
            </div>
            <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
              <Wifi size={14} /> {connected ? 'Conectado' : 'Desconectado'}
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">URL del Servidor</div>
              <div className="setting-value">{config.serverUrl}</div>
            </div>
            <button className="btn-ghost btn-icon" onClick={() => copyToClipboard(config.serverUrl)}>
              <Copy size={14} />
            </button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Puerto WebSocket</div>
              <div className="setting-value">{config.wsPort}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-header">
          <Database size={18} /> API Endpoints
        </div>
        <div className="settings-card">
          {[
            { method: 'GET', path: '/api/ads', desc: 'Listar anuncios' },
            { method: 'POST', path: '/api/ads', desc: 'Crear anuncio' },
            { method: 'PUT', path: '/api/ads/:id', desc: 'Actualizar anuncio' },
            { method: 'DELETE', path: '/api/ads/:id', desc: 'Eliminar anuncio' }
          ].map((ep, i) => (
            <div className="endpoint-item" key={i}>
              <span className={`method-badge ${ep.method.toLowerCase()}`}>{ep.method}</span>
              <code>{ep.path}</code>
              <span className="endpoint-desc">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-header">
          <Bell size={18} /> Preferencias
        </div>
        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Auto-refrescar</div>
              <div className="setting-desc">Actualizar lista automáticamente</div>
            </div>
            <div className={`toggle ${config.autoRefresh ? 'active' : ''}`} onClick={() => update('autoRefresh', !config.autoRefresh)} />
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Notificaciones</div>
              <div className="setting-desc">Alertas de nuevos anuncios</div>
            </div>
            <div className={`toggle ${config.notifications ? 'active' : ''}`} onClick={() => update('notifications', !config.notifications)} />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-header">
          <Zap size={18} /> Eventos WebSocket
        </div>
        <div className="settings-card">
          <div className="events-table">
            <div className="events-header">Eventos recibidos (del servidor)</div>
            {[
              { event: 'ads_update', data: '{ ads: Ad[] }', desc: 'Lista completa' },
              { event: 'ad_created', data: '{ ad: Ad }', desc: 'Nuevo anuncio' },
              { event: 'ad_updated', data: '{ ad: Ad }', desc: 'Actualizado' },
              { event: 'ad_deleted', data: '{ id: number }', desc: 'Eliminado' },
              { event: 'ad_click', data: '{ id, clicks }', desc: 'Click registrado' },
              { event: 'notification', data: '{ title, message }', desc: 'Push notification' }
            ].map((e, i) => (
              <div className="event-item" key={i}>
                <code className="event-name">{e.event}</code>
                <code className="event-data">{e.data}</code>
                <span className="event-desc">{e.desc}</span>
              </div>
            ))}
            <div className="events-header" style={{ marginTop: '1rem' }}>Eventos enviados (al servidor)</div>
            {[
              { event: 'get_ads', data: '-', desc: 'Solicitar anuncios' },
              { event: 'ad_click', data: '{ adId: number }', desc: 'Registrar click' },
              { event: 'push_notification', data: '{ title, message, type }', desc: 'Enviar notificación' }
            ].map((e, i) => (
              <div className="event-item" key={i}>
                <code className="event-name">{e.event}</code>
                <code className="event-data">{e.data}</code>
                <span className="event-desc">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-header">
          <ExternalLink size={18} /> Integración
        </div>
        <div className="settings-card">
          <div className="code-block">
            <div className="code-header">Widget HTML</div>
            <pre>{`<script src="${config.serverUrl}/ad-widget.js" 
  data-server="${config.serverUrl}"
  data-container="ad-container"
  data-type="banner">
</script>
<div id="ad-container"></div>`}</pre>
            <button className="btn-ghost btn-sm" onClick={() => copyToClipboard(`<script src="${config.serverUrl}/ad-widget.js" data-server="${config.serverUrl}" data-container="ad-container" data-type="banner"></script><div id="ad-container"></div>`)}>
              <Copy size={12} /> Copiar
            </button>
          </div>
          <div className="code-block" style={{ marginTop: '1rem' }}>
            <div className="code-header">JavaScript</div>
            <pre>{`const socket = io("${config.serverUrl}");

// Escuchar eventos
socket.on("ads_update", ({ ads }) => renderAds(ads));
socket.on("ad_created", ({ ad }) => console.log("Nuevo:", ad));
socket.on("ad_updated", ({ ad }) => console.log("Editado:", ad));
socket.on("ad_deleted", ({ id }) => console.log("Eliminado:", id));

// Registrar click
socket.emit("ad_click", { adId: 1 });`}</pre>
            <button className="btn-ghost btn-sm" onClick={() => copyToClipboard(`const socket = io("${config.serverUrl}");\nsocket.on("ads_update", ({ ads }) => renderAds(ads));`)}>
              <Copy size={12} /> Copiar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AdModal({ ad, onSubmit, onClose }) {
  const defaultOptions = {
    show_image: true,
    show_description: true,
    show_button: false,
    button_text: 'Ver más',
    button_url: '',
    clickable_image: true,
    auto_close: false,
    auto_close_time: 5,
    show_close_btn: true,
    animation: 'fade',
    // Posicionamiento
    content_position: 'bottom', // top, center, bottom, overlay
    text_align: 'left', // left, center, right
    title_size: 'medium', // small, medium, large
    button_align: 'left', // left, center, right
    button_style: 'filled', // filled, outline, text
    padding: 'medium', // small, medium, large
    image_position: 'top' // top, left, right, background
  };
  
  const [form, setForm] = useState({
    title: '', content: '', image_url: '', link_url: '', type: 'banner', is_active: true,
    options: defaultOptions,
    ...(ad || {})
  });
  const [tab, setTab] = useState('content');
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateOption = (k, v) => setForm(p => ({ ...p, options: { ...p.options, [k]: v } }));

  const types = [
    { id: 'banner', icon: Image, label: 'Banner', desc: 'Anuncio horizontal' },
    { id: 'popup', icon: MessageSquare, label: 'Popup', desc: 'Ventana emergente' },
    { id: 'sidebar', icon: PanelRight, label: 'Sidebar', desc: 'Barra lateral' }
  ];

  const animations = [
    { id: 'fade', label: 'Fade' },
    { id: 'slide', label: 'Slide' },
    { id: 'zoom', label: 'Zoom' },
    { id: 'bounce', label: 'Bounce' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{ad ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}</h2>
            <p className="modal-subtitle">Configura los detalles de tu anuncio</p>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-tabs">
          <button className={`tab ${tab === 'content' ? 'active' : ''}`} onClick={() => setTab('content')}>
            <Type size={14} /> Contenido
          </button>
          <button className={`tab ${tab === 'design' ? 'active' : ''}`} onClick={() => setTab('design')}>
            <Palette size={14} /> Diseño
          </button>
          <button className={`tab ${tab === 'options' ? 'active' : ''}`} onClick={() => setTab('options')}>
            <Layers size={14} /> Opciones
          </button>
          <button className={`tab ${tab === 'position' ? 'active' : ''}`} onClick={() => setTab('position')}>
            <Move size={14} /> Posición
          </button>
          <button className={`tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>
            <Eye size={14} /> Vista previa
          </button>
        </div>
        
        <div className="modal-body">
          {tab === 'content' && (
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Título del anuncio *</label>
                <input className="form-input form-input-lg" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ej: Oferta de Verano 2025" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={form.content} onChange={e => update('content', e.target.value)} placeholder="Describe tu anuncio..." />
                <span className="form-hint">{form.content?.length || 0}/200 caracteres</span>
              </div>
              <div className="form-group">
                <label className="form-label">URL de destino (al hacer clic)</label>
                <div className="input-with-icon">
                  <Link2 size={16} className="input-icon" />
                  <input className="form-input" value={form.link_url} onChange={e => update('link_url', e.target.value)} placeholder="https://tu-sitio.com/landing" />
                </div>
              </div>
            </div>
          )}

          {tab === 'design' && (
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Tipo de anuncio</label>
                <div className="type-selector">
                  {types.map(t => (
                    <div key={t.id} className={`type-card ${form.type === t.id ? 'active' : ''}`} onClick={() => update('type', t.id)}>
                      <t.icon size={24} className="type-icon" />
                      <span className="type-label">{t.label}</span>
                      <span className="type-desc">{t.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Imagen del anuncio</label>
                <div className="image-upload">
                  {form.image_url ? (
                    <div className="image-preview">
                      <img src={form.image_url} alt="Preview" onError={e => e.target.style.display='none'} />
                      <button className="btn-remove" onClick={() => update('image_url', '')}><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="image-placeholder"><Image size={32} strokeWidth={1} /><span>Sin imagen</span></div>
                  )}
                </div>
                <input className="form-input" value={form.image_url} onChange={e => update('image_url', e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" style={{ marginTop: '0.5rem' }} />
              </div>
              <div className="form-group">
                <div className="toggle-card">
                  <div className="toggle-info">
                    <span className="toggle-title">Estado del anuncio</span>
                    <span className="toggle-desc">{form.is_active ? 'El anuncio está visible' : 'El anuncio está oculto'}</span>
                  </div>
                  <div className={`toggle ${form.is_active ? 'active' : ''}`} onClick={() => update('is_active', !form.is_active)} />
                </div>
              </div>
            </div>
          )}

          {tab === 'options' && (
            <div className="form-section">
              <div className="options-section">
                <div className="options-title"><Image size={16} /> Elementos visibles</div>
                <div className="options-grid">
                  <div className="option-card">
                    <div className="option-header">
                      <div className="option-info">
                        <Image size={16} />
                        <span>Mostrar imagen</span>
                      </div>
                      <div className={`toggle ${form.options?.show_image ? 'active' : ''}`} onClick={() => updateOption('show_image', !form.options?.show_image)} />
                    </div>
                    <p className="option-desc">La imagen será visible en el anuncio</p>
                  </div>
                  
                  <div className="option-card">
                    <div className="option-header">
                      <div className="option-info">
                        <FileText size={16} />
                        <span>Mostrar descripción</span>
                      </div>
                      <div className={`toggle ${form.options?.show_description ? 'active' : ''}`} onClick={() => updateOption('show_description', !form.options?.show_description)} />
                    </div>
                    <p className="option-desc">El texto descriptivo será visible</p>
                  </div>

                  <div className="option-card">
                    <div className="option-header">
                      <div className="option-info">
                        <MousePointerClick size={16} />
                        <span>Imagen clickeable</span>
                      </div>
                      <div className={`toggle ${form.options?.clickable_image ? 'active' : ''}`} onClick={() => updateOption('clickable_image', !form.options?.clickable_image)} />
                    </div>
                    <p className="option-desc">Al hacer clic en la imagen, abre la URL de destino</p>
                  </div>

                  <div className="option-card">
                    <div className="option-header">
                      <div className="option-info">
                        <X size={16} />
                        <span>Botón cerrar</span>
                      </div>
                      <div className={`toggle ${form.options?.show_close_btn ? 'active' : ''}`} onClick={() => updateOption('show_close_btn', !form.options?.show_close_btn)} />
                    </div>
                    <p className="option-desc">Mostrar botón para cerrar el anuncio</p>
                  </div>
                </div>
              </div>

              <div className="options-section">
                <div className="options-title"><MousePointerClick size={16} /> Botón de acción (CTA)</div>
                <div className="option-card-full">
                  <div className="option-header">
                    <div className="option-info">
                      <span>Habilitar botón</span>
                    </div>
                    <div className={`toggle ${form.options?.show_button ? 'active' : ''}`} onClick={() => updateOption('show_button', !form.options?.show_button)} />
                  </div>
                  
                  {form.options?.show_button && (
                    <div className="option-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Texto del botón</label>
                          <input className="form-input" value={form.options?.button_text || ''} onChange={e => updateOption('button_text', e.target.value)} placeholder="Ver más" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">URL del botón</label>
                          <input className="form-input" value={form.options?.button_url || ''} onChange={e => updateOption('button_url', e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="options-section">
                <div className="options-title"><Timer size={16} /> Comportamiento</div>
                <div className="option-card-full">
                  <div className="option-header">
                    <div className="option-info">
                      <span>Cerrar automáticamente</span>
                    </div>
                    <div className={`toggle ${form.options?.auto_close ? 'active' : ''}`} onClick={() => updateOption('auto_close', !form.options?.auto_close)} />
                  </div>
                  
                  {form.options?.auto_close && (
                    <div className="option-fields">
                      <div className="form-group">
                        <label className="form-label">Tiempo (segundos)</label>
                        <input type="number" className="form-input" value={form.options?.auto_close_time || 5} onChange={e => updateOption('auto_close_time', parseInt(e.target.value))} min={1} max={60} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Animación de entrada</label>
                  <div className="animation-selector">
                    {animations.map(a => (
                      <div key={a.id} className={`anim-option ${form.options?.animation === a.id ? 'active' : ''}`} onClick={() => updateOption('animation', a.id)}>
                        {a.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'position' && (
            <div className="form-section">
              <div className="options-section">
                <div className="options-title"><AlignCenter size={16} /> Alineación de texto</div>
                <div className="form-group">
                  <label className="form-label">Alineación del contenido</label>
                  <div className="align-selector">
                    {[
                      { id: 'left', icon: AlignLeft, label: 'Izquierda' },
                      { id: 'center', icon: AlignCenter, label: 'Centro' },
                      { id: 'right', icon: AlignRight, label: 'Derecha' }
                    ].map(a => (
                      <div key={a.id} className={`align-option ${form.options?.text_align === a.id ? 'active' : ''}`} onClick={() => updateOption('text_align', a.id)}>
                        <a.icon size={18} />
                        <span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tamaño del título</label>
                  <div className="size-selector">
                    {[
                      { id: 'small', label: 'Pequeño' },
                      { id: 'medium', label: 'Mediano' },
                      { id: 'large', label: 'Grande' }
                    ].map(s => (
                      <div key={s.id} className={`size-option ${form.options?.title_size === s.id ? 'active' : ''}`} onClick={() => updateOption('title_size', s.id)}>
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="options-section">
                <div className="options-title"><Image size={16} /> Posición de imagen</div>
                <div className="form-group">
                  <div className="position-grid">
                    {[
                      { id: 'top', label: 'Arriba', desc: 'Imagen sobre el texto' },
                      { id: 'left', label: 'Izquierda', desc: 'Imagen a la izquierda' },
                      { id: 'right', label: 'Derecha', desc: 'Imagen a la derecha' },
                      { id: 'background', label: 'Fondo', desc: 'Imagen de fondo' }
                    ].map(p => (
                      <div key={p.id} className={`position-option ${form.options?.image_position === p.id ? 'active' : ''}`} onClick={() => updateOption('image_position', p.id)}>
                        <span className="position-label">{p.label}</span>
                        <span className="position-desc">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="options-section">
                <div className="options-title"><Move size={16} /> Posición del contenido</div>
                <div className="form-group">
                  <div className="content-position-selector">
                    {[
                      { id: 'top', label: 'Arriba' },
                      { id: 'center', label: 'Centro' },
                      { id: 'bottom', label: 'Abajo' },
                      { id: 'overlay', label: 'Sobre imagen' }
                    ].map(p => (
                      <div key={p.id} className={`content-pos-option ${form.options?.content_position === p.id ? 'active' : ''}`} onClick={() => updateOption('content_position', p.id)}>
                        {p.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {form.options?.show_button && (
                <div className="options-section">
                  <div className="options-title"><MousePointerClick size={16} /> Estilo del botón</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Alineación</label>
                      <div className="btn-align-selector">
                        {['left', 'center', 'right'].map(a => (
                          <div key={a} className={`btn-align-option ${form.options?.button_align === a ? 'active' : ''}`} onClick={() => updateOption('button_align', a)}>
                            {a === 'left' && <AlignLeft size={14} />}
                            {a === 'center' && <AlignCenter size={14} />}
                            {a === 'right' && <AlignRight size={14} />}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estilo</label>
                      <div className="btn-style-selector">
                        {[
                          { id: 'filled', label: 'Sólido' },
                          { id: 'outline', label: 'Borde' },
                          { id: 'text', label: 'Texto' }
                        ].map(s => (
                          <div key={s.id} className={`btn-style-option ${form.options?.button_style === s.id ? 'active' : ''}`} onClick={() => updateOption('button_style', s.id)}>
                            {s.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="options-section">
                <div className="options-title"><Layers size={16} /> Espaciado</div>
                <div className="form-group">
                  <label className="form-label">Padding interno</label>
                  <div className="padding-selector">
                    {[
                      { id: 'small', label: 'Compacto' },
                      { id: 'medium', label: 'Normal' },
                      { id: 'large', label: 'Amplio' }
                    ].map(p => (
                      <div key={p.id} className={`padding-option ${form.options?.padding === p.id ? 'active' : ''}`} onClick={() => updateOption('padding', p.id)}>
                        {p.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'preview' && (
            <div className="preview-section">
              <div className="preview-label">Así se verá tu anuncio:</div>
              <div className={`preview-ad preview-${form.type} preview-img-${form.options?.image_position || 'top'} preview-content-${form.options?.content_position || 'bottom'} preview-padding-${form.options?.padding || 'medium'}`}
                style={{ textAlign: form.options?.text_align || 'left' }}>
                {form.options?.show_close_btn && <button className="preview-close"><X size={14} /></button>}
                {form.options?.show_image && form.image_url && (
                  <img src={form.image_url} alt="" onError={e => e.target.style.display='none'} style={{ cursor: form.options?.clickable_image ? 'pointer' : 'default' }} />
                )}
                <div className="preview-content">
                  <h3 className={`title-${form.options?.title_size || 'medium'}`}>{form.title || 'Título del anuncio'}</h3>
                  {form.options?.show_description && <p>{form.content || 'Descripción del anuncio...'}</p>}
                  {form.options?.show_button && (
                    <div style={{ textAlign: form.options?.button_align || 'left' }}>
                      <button className={`preview-cta cta-${form.options?.button_style || 'filled'}`}>{form.options?.button_text || 'Ver más'}</button>
                    </div>
                  )}
                  {!form.options?.show_button && form.link_url && (
                    <span className="preview-link"><Link2 size={12} /> {form.link_url}</span>
                  )}
                </div>
                <span className={`preview-badge badge-${form.type}`}>{form.type}</span>
                {form.options?.auto_close && (
                  <span className="preview-timer"><Timer size={10} /> {form.options?.auto_close_time}s</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <div className="footer-left">
            <span className={`status-pill ${form.is_active ? 'active' : 'inactive'}`}>
              <Circle size={8} fill={form.is_active ? 'currentColor' : 'none'} /> {form.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="footer-right">
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary btn-lg" onClick={() => form.title && onSubmit(form)} disabled={!form.title}>
              {ad ? <><Save size={16} /> Guardar</> : <><Sparkles size={16} /> Crear</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
