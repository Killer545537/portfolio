import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SITE_URL } from '@/lib/data';
import { useQRCodeModal } from '@/lib/portfolio-context';

export function QRCodeModal() {
    const { showQRCode, setShowQRCode } = useQRCodeModal();

    return (
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
            <DialogContent className='max-w-sm'>
                <DialogHeader>
                    <DialogTitle className='sr-only'>QR Code</DialogTitle>
                </DialogHeader>
                <div className='flex flex-col items-center gap-6 py-4'>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${SITE_URL}/`)}`}
                        alt='QR Code'
                        className='w-48 h-48'
                    />
                    <p className='text-center text-sm text-zinc-500'>
                        Scan to view this portfolio on mobile devices.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
