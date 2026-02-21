import { Bot, Github, Linkedin, Mail, QrCode, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { PROFILE } from '@/lib/data';
import {
    useContactModal,
    useMarkdownMode,
    useQRCodeModal,
} from '@/lib/portfolio-context';

export function FloatingNav() {
    const { isMarkdownMode, toggleMarkdownMode } = useMarkdownMode();
    const { openQRCode } = useQRCodeModal();
    const { openContactModal } = useContactModal();

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
                                onClick={toggleMarkdownMode}
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
                                onClick={openQRCode}
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
                />
                <SocialLink
                    href={PROFILE.contact.linkedin}
                    icon={<Linkedin size={18} />}
                    label='LinkedIn'
                />
                <SocialLink
                    href={PROFILE.contact.twitter}
                    icon={<Twitter size={18} />}
                    label='Twitter'
                />

                <NavDivider />

                {/* Contact Modal Trigger */}
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={openContactModal}
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
}

function SocialLink({ href, icon, label }: SocialLinkProps) {
    if (!href) return null;

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <a
                        href={href}
                        target='_blank'
                        rel='noreferrer'
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
