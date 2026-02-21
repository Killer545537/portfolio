import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { INTERESTS, PROFILE } from '@/lib/data';
import { useScrollProgress } from '@/lib/portfolio-context';
import { GitHubHeatmap } from '../GitHubHeatmap';

export function ProfileSection() {
    const scrollProgress = useScrollProgress();

    return (
        <div
            className='lg:col-span-5 pt-12 lg:pt-24 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto hide-scrollbar flex flex-col transition-all duration-75 ease-out'
            style={{
                opacity: `calc(1 - ${scrollProgress} * 1.5)`,
                filter: `blur(${scrollProgress * 8}px)`,
                transform: `translateX(-${scrollProgress * 60}px)`,
                pointerEvents: scrollProgress > 0.8 ? 'none' : 'auto',
            }}
        >
            <div className='space-y-10 pb-12'>
                {/* Header Profile */}
                <ProfileHeader />

                {/* GitHub Activity */}
                <CodeActivitySection />

                {/* Interests */}
                <InterestsSection />

                {/* Footer */}
                <ProfileFooter />
            </div>
        </div>
    );
}

function ProfileHeader() {
    return (
        <div className='flex flex-col items-start text-left' id='profile'>
            <Avatar className='w-20 h-20 mb-6 ring-2 ring-zinc-50 shadow-lg shadow-zinc-100'>
                <AvatarImage
                    src={PROFILE.avatar}
                    alt={PROFILE.name}
                    className='object-cover'
                />
                <AvatarFallback>
                    {PROFILE.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                </AvatarFallback>
            </Avatar>

            <h1 className='text-5xl font-bold tracking-tight text-zinc-900 mb-2'>
                {PROFILE.name}
            </h1>

            <h2 className='text-xl font-medium text-zinc-600 mb-1'>
                {PROFILE.title}
            </h2>

            <p className='text-zinc-400 text-sm font-mono tracking-widest mb-6'>
                {PROFILE.phonetic} · {PROFILE.location}
            </p>

            <div className='text-base text-zinc-600 leading-relaxed font-light space-y-4'>
                {PROFILE.bio.lines.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                ))}
            </div>
        </div>
    );
}

function CodeActivitySection() {
    return (
        <div className='border-t border-zinc-100 pt-8'>
            <h3 className='text-xs uppercase text-zinc-400 font-bold tracking-wider mb-4'>
                Code Activity
            </h3>
            <div className='bg-zinc-50/50 border border-zinc-100 rounded-xl p-4 overflow-hidden'>
                <GitHubHeatmap />
            </div>
        </div>
    );
}

function InterestsSection() {
    return (
        <div className='border-t border-zinc-100 pt-8'>
            <h3 className='text-xs uppercase text-zinc-400 font-bold tracking-wider mb-4'>
                Interests
            </h3>
            <div className='flex flex-wrap gap-2'>
                {INTERESTS.map((interest) => (
                    <Badge
                        key={interest}
                        variant='secondary'
                        className='text-xs bg-zinc-100 text-zinc-500 border border-zinc-200'
                    >
                        {interest}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

function ProfileFooter() {
    return (
        <div className='hidden lg:block pt-8'>
            <p className='text-sm text-zinc-300'>
                © {new Date().getFullYear()} {PROFILE.name}
            </p>
        </div>
    );
}
