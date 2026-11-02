import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, ShoppingBag, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient, getAccessToken, getRefreshToken } from '@/lib/apiClient';

const POLL_MS = 20000;

const formatWhen = (iso) => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const TypeIcon = ({ type }) => {
  if (type === 'like') return <Heart className="w-3.5 h-3.5 text-pink-300" />;
  if (type === 'purchase') return <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />;
  return <Disc3 className="w-3.5 h-3.5 text-cyan-300" />;
};

const NotificationBell = ({ compact = false }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const unreadRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!getAccessToken() && !getRefreshToken()) return;
    try {
      const { data } = await apiClient.get('/api/notifications', { params: { limit: 40 } });
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      const nextUnread = Number(data?.unread_count) || 0;
      setItems(nextItems);
      setUnread(nextUnread);
      if (
        unreadRef.current != null &&
        nextUnread > unreadRef.current &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const fresh = nextItems.find((n) => !n.read);
        if (fresh) {
          try {
            new Notification(fresh.title || 'Kloud', { body: fresh.body || '' });
          } catch {
            // ignore browsers that block the constructor
          }
        }
      }
      unreadRef.current = nextUnread;
    } catch {
      // La cloche reste utilisable même si l'API n'est pas encore déployée.
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const markAll = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
      unreadRef.current = 0;
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const openItem = async (item) => {
    setOpen(false);
    if (!item?.read && item?.notification_id) {
      setItems((prev) => prev.map((n) => (n.notification_id === item.notification_id ? { ...n, read: true } : n)));
      setUnread((n) => Math.max(0, n - 1));
      apiClient.post(`/api/notifications/${item.notification_id}/read`).catch(() => {});
    }
    if (item?.href) navigate(item.href);
  };

  const enableBrowserAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      await Notification.requestPermission();
    } catch {
      // ignore
    }
  };

  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative rounded-full border border-white/10 bg-white/5 hover:bg-white/10 ${
            compact ? 'w-10 h-10' : 'w-9 h-9'
          }`}
          aria-label="Notifications"
          data-testid="notifications-bell"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Bell className={compact ? 'w-[18px] h-[18px]' : 'w-4 h-4'} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-cyan-400 text-[10px] font-semibold leading-none text-zinc-950 flex items-center justify-center">
              {badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(22rem,calc(100vw-1.5rem))] p-0 glass-heavy border-white/10 rounded-2xl overflow-hidden z-[80]"
        data-testid="notifications-panel"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est lu'}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-cyan-300 hover:text-cyan-200 disabled:opacity-40"
            onClick={markAll}
            disabled={loading || unread === 0}
          >
            Tout lire
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              Rien pour le moment. Les likes, achats et nouvelles sorties arriveront ici.
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.notification_id}
                type="button"
                onClick={() => openItem(item)}
                className={`w-full text-left px-4 py-3 flex gap-3 border-b border-white/5 hover:bg-white/5 ${
                  item.read ? 'opacity-70' : ''
                }`}
              >
                <span className="mt-0.5 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <TypeIcon type={item.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug">{item.title}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {item.body}
                    {item.created_at ? ` · ${formatWhen(item.created_at)}` : ''}
                  </span>
                </span>
                {!item.read && <span className="mt-2 w-2 h-2 rounded-full bg-cyan-400 shrink-0" />}
              </button>
            ))
          )}
        </div>
        {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
            onClick={enableBrowserAlerts}
          >
            Activer les alertes du navigateur
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
