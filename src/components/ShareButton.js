import React, { useMemo, useState } from 'react';
import { Check, Copy, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiOrigin } from '@/lib/apiClient';
import { copyText, nativeShare } from '@/lib/sharePage';

const ShareButton = ({
  url,
  title,
  text,
  label = 'Partager',
  variant = 'outline',
  size = 'lg',
  className = 'rounded-full px-7 glass border-white/10 hover:bg-white/10',
  testId = 'share-button'
}) => {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const qrSrc = useMemo(() => {
    if (!shareUrl) return '';
    const origin = apiOrigin();
    return `${origin}/api/share/qr.svg?u=${encodeURIComponent(shareUrl)}`;
  }, [shareUrl]);

  const onShare = async () => {
    try {
      const usedNative = await nativeShare({
        title: title || 'Kloud',
        text: text || title || '',
        url: shareUrl
      });
      if (usedNative) return;
      await copyText(shareUrl);
      setCopied(true);
      toast.success('Lien copié');
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      try {
        await copyText(shareUrl);
        toast.success('Lien copié');
      } catch {
        toast.error('Impossible de partager');
      }
    }
  };

  const onCopy = async () => {
    try {
      await copyText(shareUrl);
      setCopied(true);
      toast.success('Lien copié');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Copie impossible');
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={variant} size={size} className={className} onClick={onShare} data-testid={testId}>
          {copied ? <Check className="w-5 h-5 mr-2" /> : <Share2 className="w-5 h-5 mr-2" />}
          {copied ? 'Lien copié' : label}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={size}
          className="rounded-full px-4 glass border-white/10"
          onClick={onCopy}
          aria-label="Copier le lien"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size={size}
          className="rounded-full px-4 glass border-white/10"
          onClick={() => {
            setQrFailed(false);
            setQrOpen(true);
          }}
          aria-label="QR code"
          data-testid={`${testId}-qr`}
        >
          <QrCode className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="glass-heavy border-white/15 rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>QR code</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Scanne pour ouvrir {title || 'cette page'} sur Kloud.</p>
          <div className="mt-2 rounded-2xl bg-white p-4 flex justify-center">
            {qrSrc && !qrFailed ? (
              <img
                src={qrSrc}
                alt="QR code de partage"
                className="w-52 h-52"
                onError={() => setQrFailed(true)}
              />
            ) : (
              <p className="text-sm text-zinc-600 text-center py-8">QR indisponible — copie le lien ci-dessous.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground break-all">{shareUrl}</p>
          <Button type="button" variant="outline" className="rounded-full" onClick={onCopy}>
            Copier le lien
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareButton;
