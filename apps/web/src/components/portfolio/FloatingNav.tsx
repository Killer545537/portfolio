import { Bot, Github, Linkedin, Mail, QrCode, Twitter } from 'lucide-react';
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
                    icon={<Github size={18} />}
                    label='GitHub'
                    onClick={() => handleSocialClick('nav_github_click')}
                />
                <SocialLink
                    href={PROFILE.contact.linkedin}
                    icon={<Linkedin size={18} />}
                    label='LinkedIn'
                    onClick={() => handleSocialClick('nav_linkedin_click')}
                />
                <SocialLink
                    href={PROFILE.contact.twitter}
                    icon={<Twitter size={18} />}
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
