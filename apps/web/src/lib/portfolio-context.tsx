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

function getSessionId(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Scroll progress drives opacity/blur/translate on the profile column. It used
 * to be React state updated on every scroll event, which re-rendered every
 * section at scroll frequency for values only CSS ever consumed. It now lives
 * in a custom property on <html>, written from a rAF-throttled listener.
 *
 * `--scroll-progress` goes 0 -> 1 over the first SCROLL_RANGE pixels.
 * `data-scrolled-past` mirrors the point where the profile column stops
 * accepting pointer events, which has no pure-CSS equivalent.
 */
const SCROLL_RANGE = 400;
const POINTER_EVENTS_CUTOFF = 0.8;

function useScrollProgressProperty(): void {
    useEffect(() => {
        const root = document.documentElement;
        let frame = 0;

        const apply = () => {
            frame = 0;
            const progress = Math.min(window.scrollY / SCROLL_RANGE, 1);
            root.style.setProperty('--scroll-progress', String(progress));
            root.toggleAttribute(
                'data-scrolled-past',
                progress > POINTER_EVENTS_CUTOFF,
            );
        };

        const onScroll = () => {
            frame ||= requestAnimationFrame(apply);
        };

        apply();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
            root.style.removeProperty('--scroll-progress');
            root.removeAttribute('data-scrolled-past');
        };
    }, []);
}

interface PortfolioContextValue {
    isMarkdownMode: boolean;
    toggleMarkdownMode: () => void;

    showQRCode: boolean;
    setShowQRCode: (value: boolean) => void;
    openQRCode: () => void;

    showContactModal: boolean;
    openContactModal: () => void;
    closeContactModal: () => void;

    isTechExpanded: boolean;
    expandTech: () => void;
    collapseTech: () => void;

    track: (eventType: EventType, metadata?: Record<string, string>) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [isMarkdownMode, setIsMarkdownMode] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [isTechExpanded, setIsTechExpanded] = useState(false);
    const [sessionId] = useState<string>(getSessionId);

    useScrollProgressProperty();

    const track = useCallback(
        (eventType: EventType, metadata?: Record<string, string>) => {
            // Fire and forget - don't block UI
            trackEvent({ data: { eventType, sessionId, metadata } }).catch(
                (error: unknown) => {
                    console.error('Analytics tracking failed:', error);
                },
            );
        },
        [sessionId],
    );

    const toggleMarkdownMode = useCallback(
        () => setIsMarkdownMode((v) => !v),
        [],
    );
    const openQRCode = useCallback(() => setShowQRCode(true), []);
    const openContactModal = useCallback(() => setShowContactModal(true), []);
    const closeContactModal = useCallback(() => setShowContactModal(false), []);
    const expandTech = useCallback(() => setIsTechExpanded(true), []);
    const collapseTech = useCallback(() => setIsTechExpanded(false), []);

    const value = useMemo<PortfolioContextValue>(
        () => ({
            isMarkdownMode,
            toggleMarkdownMode,
            showQRCode,
            setShowQRCode,
            openQRCode,
            showContactModal,
            openContactModal,
            closeContactModal,
            isTechExpanded,
            expandTech,
            collapseTech,
            track,
        }),
        [
            isMarkdownMode,
            toggleMarkdownMode,
            showQRCode,
            openQRCode,
            showContactModal,
            openContactModal,
            closeContactModal,
            isTechExpanded,
            expandTech,
            collapseTech,
            track,
        ],
    );

    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
}

function usePortfolioContext(): PortfolioContextValue {
    const context = useContext(PortfolioContext);

    if (!context) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }

    return context;
}

// Slice hooks, so a component subscribes to a name rather than the whole
// context. Each exposes only what has a call site.
export function useMarkdownMode() {
    const { isMarkdownMode, toggleMarkdownMode } = usePortfolioContext();
    return { isMarkdownMode, toggleMarkdownMode };
}

export function useQRCodeModal() {
    const { showQRCode, setShowQRCode, openQRCode } = usePortfolioContext();
    return { showQRCode, setShowQRCode, openQRCode };
}

export function useContactModal() {
    const { showContactModal, openContactModal, closeContactModal } =
        usePortfolioContext();
    return { showContactModal, openContactModal, closeContactModal };
}

export function useTechExpanded() {
    const { isTechExpanded, expandTech, collapseTech } = usePortfolioContext();
    return { isTechExpanded, expandTech, collapseTech };
}

export function useTrack() {
    const { track } = usePortfolioContext();
    return track;
}
