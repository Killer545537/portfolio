import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface PortfolioContextValue {
    // Scroll state
    scrollProgress: number;

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
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

interface PortfolioProviderProps {
    children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
    // Scroll progress state
    const [scrollProgress, setScrollProgress] = useState(0);

    // View mode states
    const [isMarkdownMode, setIsMarkdownMode] = useState(false);

    // Modal states
    const [showQRCode, setShowQRCode] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    // Tech stack expansion state
    const [isTechExpanded, setIsTechExpanded] = useState(false);

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

    // Memoized context value to prevent unnecessary re-renders
    const value = useMemo<PortfolioContextValue>(
        () => ({
            // Scroll state
            scrollProgress,

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
        }),
        [
            scrollProgress,
            isMarkdownMode,
            showQRCode,
            showContactModal,
            isTechExpanded,
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
