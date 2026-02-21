import type { ReactNode } from 'react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
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

// State types
interface PortfolioState {
    isMarkdownMode: boolean;
    showQRCode: boolean;
    showContactModal: boolean;
    isTechExpanded: boolean;
}

// Action types
type PortfolioAction =
    | { type: 'SET_MARKDOWN_MODE'; payload: boolean }
    | { type: 'TOGGLE_MARKDOWN_MODE' }
    | { type: 'SET_QR_CODE'; payload: boolean }
    | { type: 'OPEN_QR_CODE' }
    | { type: 'CLOSE_QR_CODE' }
    | { type: 'SET_CONTACT_MODAL'; payload: boolean }
    | { type: 'OPEN_CONTACT_MODAL' }
    | { type: 'CLOSE_CONTACT_MODAL' }
    | { type: 'SET_TECH_EXPANDED'; payload: boolean }
    | { type: 'TOGGLE_TECH_EXPANDED' }
    | { type: 'EXPAND_TECH' }
    | { type: 'COLLAPSE_TECH' };

const initialState: PortfolioState = {
    isMarkdownMode: false,
    showQRCode: false,
    showContactModal: false,
    isTechExpanded: false,
};

function portfolioReducer(
    state: PortfolioState,
    action: PortfolioAction,
): PortfolioState {
    switch (action.type) {
        case 'SET_MARKDOWN_MODE':
            return { ...state, isMarkdownMode: action.payload };
        case 'TOGGLE_MARKDOWN_MODE':
            return { ...state, isMarkdownMode: !state.isMarkdownMode };
        case 'SET_QR_CODE':
            return { ...state, showQRCode: action.payload };
        case 'OPEN_QR_CODE':
            return { ...state, showQRCode: true };
        case 'CLOSE_QR_CODE':
            return { ...state, showQRCode: false };
        case 'SET_CONTACT_MODAL':
            return { ...state, showContactModal: action.payload };
        case 'OPEN_CONTACT_MODAL':
            return { ...state, showContactModal: true };
        case 'CLOSE_CONTACT_MODAL':
            return { ...state, showContactModal: false };
        case 'SET_TECH_EXPANDED':
            return { ...state, isTechExpanded: action.payload };
        case 'TOGGLE_TECH_EXPANDED':
            return { ...state, isTechExpanded: !state.isTechExpanded };
        case 'EXPAND_TECH':
            return { ...state, isTechExpanded: true };
        case 'COLLAPSE_TECH':
            return { ...state, isTechExpanded: false };
        default:
            return state;
    }
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
    // Use reducer for related UI state
    const [state, dispatch] = useReducer(portfolioReducer, initialState);

    // Scroll progress state (separate since it updates frequently)
    const [scrollProgress, setScrollProgress] = useState(0);

    // Viewport state - default to false for SSR
    const [isDesktop, setIsDesktop] = useState(false);

    const [sessionId] = useState<string>(() => getSessionId());

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
            isMarkdownMode: state.isMarkdownMode,
            setIsMarkdownMode: (value: boolean) =>
                dispatch({ type: 'SET_MARKDOWN_MODE', payload: value }),
            toggleMarkdownMode: () => dispatch({ type: 'TOGGLE_MARKDOWN_MODE' }),

            // QR Code modal
            showQRCode: state.showQRCode,
            setShowQRCode: (value: boolean) =>
                dispatch({ type: 'SET_QR_CODE', payload: value }),
            openQRCode: () => dispatch({ type: 'OPEN_QR_CODE' }),
            closeQRCode: () => dispatch({ type: 'CLOSE_QR_CODE' }),

            // Contact modal
            showContactModal: state.showContactModal,
            setShowContactModal: (value: boolean) =>
                dispatch({ type: 'SET_CONTACT_MODAL', payload: value }),
            openContactModal: () => dispatch({ type: 'OPEN_CONTACT_MODAL' }),
            closeContactModal: () => dispatch({ type: 'CLOSE_CONTACT_MODAL' }),

            // Tech stack expansion
            isTechExpanded: state.isTechExpanded,
            setIsTechExpanded: (value: boolean) =>
                dispatch({ type: 'SET_TECH_EXPANDED', payload: value }),
            toggleTechExpanded: () => dispatch({ type: 'TOGGLE_TECH_EXPANDED' }),
            expandTech: () => dispatch({ type: 'EXPAND_TECH' }),
            collapseTech: () => dispatch({ type: 'COLLAPSE_TECH' }),

            // Analytics
            track,
        }),
        [
            scrollProgress,
            isDesktop,
            state.isMarkdownMode,
            state.showQRCode,
            state.showContactModal,
            state.isTechExpanded,
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

// Optional: Export individual hooks for specific slices of state
export function useScrollProgress(): number {
    const { scrollProgress } = usePortfolioContext();
    return scrollProgress;
}

export function useIsDesktop(): boolean {
    const { isDesktop } = usePortfolioContext();
    return isDesktop;
}

export function useMarkdownMode() {
    const { isMarkdownMode, setIsMarkdownMode, toggleMarkdownMode } =
        usePortfolioContext();
    return { isMarkdownMode, setIsMarkdownMode, toggleMarkdownMode };
}

export function useQRCodeModal() {
    const { showQRCode, setShowQRCode, openQRCode, closeQRCode } =
        usePortfolioContext();
    return { showQRCode, setShowQRCode, openQRCode, closeQRCode };
}

export function useContactModal() {
    const {
        showContactModal,
        setShowContactModal,
        openContactModal,
        closeContactModal,
    } = usePortfolioContext();
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
    } = usePortfolioContext();
    return {
        isTechExpanded,
        setIsTechExpanded,
        toggleTechExpanded,
        expandTech,
        collapseTech,
    };
}

export function useTrack() {
    const { track } = usePortfolioContext();
    return track;
}
