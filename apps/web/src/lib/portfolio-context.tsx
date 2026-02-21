import type { ReactNode } from 'react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import type { EventType } from './analytics';
import { trackEvent } from './analytics';

function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getSessionId(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

interface PortfolioContextValue {
    // Scroll state
    scrollProgress: number;

    // Viewport state
    isDesktop: boolean;

    // View modes
    isMarkdownMode: boolean;
    setIsMarkdownMode: (value: boolean) => void;
    toggleMarkdownMode: () => void;

    // Modal states
    showQRCode: boolean;
    setShowQRCode: (value: boolean) => void;
    openQRCode: () => void;
    closeQRCode: () => void;

    showContactModal: boolean;
    setShowContactModal: (value: boolean) => void;
    openContactModal: () => void;
    closeContactModal: () => void;

    // Tech stack expansion
    isTechExpanded: boolean;
    setIsTechExpanded: (value: boolean) => void;
    toggleTechExpanded: () => void;
    expandTech: () => void;
    collapseTech: () => void;

    // Analytics
    track: (eventType: EventType, metadata?: Record<string, unknown>) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

interface PortfolioProviderProps {
    children: ReactNode;
}

// Tailwind lg breakpoint
const LG_BREAKPOINT = 1024;

export function PortfolioProvider({ children }: PortfolioProviderProps) {
    // Scroll progress state
    const [scrollProgress, setScrollProgress] = useState(0);

    // Viewport state - default to false for SSR
    const [isDesktop, setIsDesktop] = useState(false);

    // View mode states
    const [isMarkdownMode, setIsMarkdownMode] = useState(false);

    // Modal states
    const [showQRCode, setShowQRCode] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    // Tech stack expansion state
    const [isTechExpanded, setIsTechExpanded] = useState(false);

    // Analytics session
    const [sessionId, setSessionId] = useState<string>('');

    useEffect(() => {
        setSessionId(getSessionId());
    }, []);

    const track = useCallback(
        (eventType: EventType, metadata?: Record<string, unknown>) => {
            // Fire and forget - don't block UI
            trackEvent({
                data: {
                    eventType,
                    sessionId,
                    metadata,
                },
            }).catch((error: unknown) => {
                console.error('Analytics tracking failed:', error);
            });
        },
        [sessionId],
    );

    // Scroll progress effect
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY;
            const maxScroll = 400;
            const progress = Math.min(scrolled / maxScroll, 1);
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Viewport detection effect
    useEffect(() => {
        const checkIsDesktop = () => {
            setIsDesktop(window.innerWidth >= LG_BREAKPOINT);
        };

        // Check on mount
        checkIsDesktop();

        // Listen for resize
        window.addEventListener('resize', checkIsDesktop, { passive: true });

        return () => window.removeEventListener('resize', checkIsDesktop);
    }, []);

    // Memoized context value to prevent unnecessary re-renders
    const value = useMemo<PortfolioContextValue>(
        () => ({
            // Scroll state
            scrollProgress,

            // Viewport state
            isDesktop,

            // Markdown mode
            isMarkdownMode,
            setIsMarkdownMode,
            toggleMarkdownMode: () => setIsMarkdownMode((prev) => !prev),

            // QR Code modal
            showQRCode,
            setShowQRCode,
            openQRCode: () => setShowQRCode(true),
            closeQRCode: () => setShowQRCode(false),

            // Contact modal
            showContactModal,
            setShowContactModal,
            openContactModal: () => setShowContactModal(true),
            closeContactModal: () => setShowContactModal(false),

            // Tech stack expansion
            isTechExpanded,
            setIsTechExpanded,
            toggleTechExpanded: () => setIsTechExpanded((prev) => !prev),
            expandTech: () => setIsTechExpanded(true),
            collapseTech: () => setIsTechExpanded(false),

            // Analytics
            track,
        }),
        [
            scrollProgress,
            isDesktop,
            isMarkdownMode,
            showQRCode,
            showContactModal,
            isTechExpanded,
            track,
        ],
    );

    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio(): PortfolioContextValue {
    const context = useContext(PortfolioContext);

    if (!context) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }

    return context;
}

// Optional: Export individual hooks for specific slices of state
export function useScrollProgress(): number {
    const { scrollProgress } = usePortfolio();
    return scrollProgress;
}

export function useIsDesktop(): boolean {
    const { isDesktop } = usePortfolio();
    return isDesktop;
}

export function useMarkdownMode() {
    const { isMarkdownMode, setIsMarkdownMode, toggleMarkdownMode } =
        usePortfolio();
    return { isMarkdownMode, setIsMarkdownMode, toggleMarkdownMode };
}

export function useQRCodeModal() {
    const { showQRCode, setShowQRCode, openQRCode, closeQRCode } =
        usePortfolio();
    return { showQRCode, setShowQRCode, openQRCode, closeQRCode };
}

export function useContactModal() {
    const {
        showContactModal,
        setShowContactModal,
        openContactModal,
        closeContactModal,
    } = usePortfolio();
    return {
        showContactModal,
        setShowContactModal,
        openContactModal,
        closeContactModal,
    };
}

export function useTechExpanded() {
    const {
        isTechExpanded,
        setIsTechExpanded,
        toggleTechExpanded,
        expandTech,
        collapseTech,
    } = usePortfolio();
    return {
        isTechExpanded,
        setIsTechExpanded,
        toggleTechExpanded,
        expandTech,
        collapseTech,
    };
}

export function useTrack() {
    const { track } = usePortfolio();
    return track;
}
