import { Bot, Mail, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { EventType } from '@/lib/analytics';
import { PROFILE } from '@/lib/data';
import {
    useContactModal,
    useMarkdownMode,
    useQRCodeModal,
    useTrack,
} from '@/lib/portfolio-context';

export function FloatingNav() {
    const { isMarkdownMode, toggleMarkdownMode } = useMarkdownMode();
    const { openQRCode } = useQRCodeModal();
    const { openContactModal } = useContactModal();
    const track = useTrack();

    const handleMarkdownToggle = () => {
        track('nav_markdown_toggle');
        toggleMarkdownMode();
    };

    const handleQRCodeClick = () => {
        track('nav_qrcode_click');
        openQRCode();
    };

    const handleContactClick = () => {
        track('nav_contact_click');
        openContactModal();
    };

    const handleSocialClick = (eventType: EventType) => {
        track(eventType);
    };

    return (
        <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-50'>
            <nav className='flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-zinc-900 border border-zinc-200 rounded-full px-4 py-3 shadow-2xl shadow-zinc-200/50'>
                {/* Markdown Toggle */}
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant={isMarkdownMode ? 'default' : 'ghost'}
                                size='icon'
                                onClick={handleMarkdownToggle}
                                className='w-9 h-9 rounded-full'
                            >
                                <Bot size={18} />
                            </Button>
                        }
                    />
                    <TooltipContent>Toggle Markdown Mode</TooltipContent>
                </Tooltip>

                {/* QR Code */}
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={handleQRCodeClick}
                                className='w-9 h-9 rounded-full'
                            >
                                <QrCode size={18} />
                            </Button>
                        }
                    />
                    <TooltipContent>Show QR Code</TooltipContent>
                </Tooltip>

                <NavDivider />

                {/* Social Links */}
                <SocialLink
                    href={PROFILE.contact.github}
                    icon={<BrandIcon name='github' />}
                    label='GitHub'
                    onClick={() => handleSocialClick('nav_github_click')}
                />
                <SocialLink
                    href={PROFILE.contact.linkedin}
                    icon={<BrandIcon name='linkedin' />}
                    label='LinkedIn'
                    onClick={() => handleSocialClick('nav_linkedin_click')}
                />
                <SocialLink
                    href={PROFILE.contact.twitter}
                    icon={<BrandIcon name='x' />}
                    label='Twitter'
                    onClick={() => handleSocialClick('nav_twitter_click')}
                />

                <NavDivider />

                {/* Contact Modal Trigger */}
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={handleContactClick}
                                className='w-9 h-9 rounded-full'
                            >
                                <Mail size={18} />
                            </Button>
                        }
                    />
                    <TooltipContent>Contact Me</TooltipContent>
                </Tooltip>
            </nav>
        </div>
    );
}

// ponytail: lucide 1.0 removed every brand icon over trademark exposure, so the
// three logos this nav needs live here as inline paths (glyphs from Simple
// Icons, CC0). Pull in a real icon package only if brand icons spread past this
// file.
const BRAND_PATHS = {
    github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    linkedin:
        'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    x: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z',
} as const;

function BrandIcon({
    name,
    size = 18,
}: {
    name: keyof typeof BRAND_PATHS;
    size?: number;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox='0 0 24 24'
            fill='currentColor'
            aria-hidden='true'
        >
            <path d={BRAND_PATHS[name]} />
        </svg>
    );
}

function NavDivider() {
    return <div className='w-px h-4 bg-zinc-200 mx-1' />;
}

interface SocialLinkProps {
    href: string | undefined;
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}

function SocialLink({ href, icon, label, onClick }: SocialLinkProps) {
    if (!href) return null;

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <a
                        href={href}
                        target='_blank'
                        rel='noreferrer'
                        aria-label={label}
                        onClick={onClick}
                        className='w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all'
                    >
                        {icon}
                    </a>
                }
            />
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}
