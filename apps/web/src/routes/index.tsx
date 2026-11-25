import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState } from 'react';
import {
    FloatingNav,
    MainContent,
    MarkdownView,
    ProfileSection,
} from '@/components/portfolio';
import {
    PortfolioProvider,
    useContactModal,
    useMarkdownMode,
    useQRCodeModal,
} from '@/lib/portfolio-context';

export const Route = createFileRoute('/')({
    head: () => ({
        meta: [
            { title: 'Srijan Mahajan | Full-Stack & Systems Developer' },
            {
                name: 'description',
                content:
                    'Full-stack developer with 2+ years of experience building high-performance systems using Rust and TypeScript. Focused on API design, authentication protocols, distributed systems, and real-time applications.',
            },
        ],
    }),
    component: PortfolioPage,
});

// The modals are closed on first paint, so their code (dialog primitives, the
// contact form and its server-function client) loads in separate chunks: on
// idle after hydration, or on first open if that comes sooner.
const loadQRCodeModal = () =>
    import('@/components/portfolio/modals/QRCodeModal').then((m) => ({
        default: m.QRCodeModal,
    }));
const loadContactModal = () =>
    import('@/components/portfolio/modals/ContactModal').then((m) => ({
        default: m.ContactModal,
    }));

const QRCodeModal = lazy(loadQRCodeModal);
const ContactModal = lazy(loadContactModal);

function usePrefetchOnIdle() {
    useEffect(() => {
        const prefetch = () => {
            loadQRCodeModal().catch(() => {});
            loadContactModal().catch(() => {});
        };

        if ('requestIdleCallback' in window) {
            const handle = requestIdleCallback(prefetch, { timeout: 5000 });
            return () => cancelIdleCallback(handle);
        }
        const handle = setTimeout(prefetch, 2000);
        return () => clearTimeout(handle);
    }, []);
}

/** True from the first time `open` is true onward, so a modal mounts on first
 * open and then stays mounted to animate closed. */
function useOpenedOnce(open: boolean): boolean {
    const [opened, setOpened] = useState(open);
    if (open && !opened) setOpened(true);
    return opened || open;
}

function PortfolioPage() {
    return (
        <PortfolioProvider>
            <PortfolioLayout />
        </PortfolioProvider>
    );
}

function PortfolioLayout() {
    const { isMarkdownMode } = useMarkdownMode();
    const { showQRCode } = useQRCodeModal();
    const { showContactModal } = useContactModal();
    const qrCodeOpened = useOpenedOnce(showQRCode);
    const contactOpened = useOpenedOnce(showContactModal);

    usePrefetchOnIdle();

    return (
        <div className='min-h-screen bg-white selection:bg-zinc-900 selection:text-white pb-24 lg:pb-0'>
            {isMarkdownMode ? (
                <MarkdownView />
            ) : (
                <main className='max-w-350 mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24'>
                    <ProfileSection />
                    <MainContent />
                </main>
            )}

            {/* Floating Navigation */}
            <FloatingNav />

            {/* Modals */}
            {qrCodeOpened && (
                <Suspense fallback={null}>
                    <QRCodeModal />
                </Suspense>
            )}
            {contactOpened && (
                <Suspense fallback={null}>
                    <ContactModal />
                </Suspense>
            )}
        </div>
    );
}
