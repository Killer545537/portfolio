import { createFileRoute } from '@tanstack/react-router';
import {
    ContactModal,
    FloatingNav,
    MainContent,
    MarkdownView,
    ProfileSection,
    QRCodeModal,
} from '@/components/portfolio';
import { getGitHubContributions } from '@/lib/github-contributions';
import { PortfolioProvider, useMarkdownMode } from '@/lib/portfolio-context';

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
    loader: () => getGitHubContributions(),
    component: PortfolioPage,
});

function PortfolioPage() {
    return (
        <PortfolioProvider>
            <PortfolioLayout />
        </PortfolioProvider>
    );
}

function PortfolioLayout() {
    const { isMarkdownMode } = useMarkdownMode();

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
            <QRCodeModal />
            <ContactModal />
        </div>
    );
}
