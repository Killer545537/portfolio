import { ChevronDown, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TECH_STACK } from '@/lib/data';
import { useTechExpanded, useTrack } from '@/lib/portfolio-context';
import type { TechItem } from '@/lib/types';
import { Section } from '../Section';

function TechCategory({ title, items }: { title: string; items: TechItem[] }) {
    return (
        <div className='mb-6 last:mb-0'>
            <h4 className='text-xs uppercase text-zinc-400 font-bold tracking-wider mb-3'>
                {title}
            </h4>
            <div className='flex flex-wrap gap-3'>
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className='flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-md px-2.5 py-1.5 hover:border-zinc-300 transition-colors'
                    >
                        {item.icon ? (
                            <img
                                src={item.icon}
                                alt={item.name}
                                className='w-4 h-4'
                            />
                        ) : (
                            <div className='w-2 h-2 rounded-full bg-zinc-300' />
                        )}
                        <span className='text-sm font-medium text-zinc-700'>
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ScrollingTechLogos() {
    const allTechItems = [
        ...TECH_STACK.languages,
        ...TECH_STACK.backend,
        ...TECH_STACK.databases,
        ...TECH_STACK.cloudDevOps,
        ...TECH_STACK.frontend,
    ].filter((item) => item.icon);

    const scrollingTechItems = [...allTechItems, ...allTechItems];

    return (
        <div className='flex flex-col'>
            <div className='relative w-full overflow-hidden py-8'>
                {/* Gradient Masks */}
                <div className='absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-r from-zinc-50 to-transparent z-10 pointer-events-none' />
                <div className='absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-linear-to-l from-zinc-50 to-transparent z-10 pointer-events-none' />

                {/* The scrolling container */}
                <div className='flex gap-12 animate-scroll w-max items-center pl-4 py-2'>
                    {scrollingTechItems.map((item, idx) => (
                        <div
                            key={`${idx}-${item.name}`}
                            className='shrink-0 transition-all duration-300 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transform group-hover:scale-110'
                            title={item.name}
                        >
                            <img
                                src={item.icon}
                                alt={item.name}
                                className='w-8 h-8 md:w-10 md:h-10 object-contain'
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ExpandedTechView() {
    const { collapseTech } = useTechExpanded();
    const track = useTrack();

    const handleCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        track('tech_expand_click', { action: 'collapse' });
        collapseTech();
    };

    return (
        <div className='animate-in fade-in zoom-in-95 duration-300'>
            <div className='flex justify-between items-center mb-6 border-b border-zinc-100 pb-4'>
                <span className='text-sm font-semibold text-zinc-400'>
                    Detailed View
                </span>
                <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={handleCollapse}
                    title='Collapse'
                >
                    <Minimize2 size={16} />
                </Button>
            </div>
            <div className='space-y-2'>
                <TechCategory title='Languages' items={TECH_STACK.languages} />
                <TechCategory
                    title='Backend & API'
                    items={TECH_STACK.backend}
                />
                <TechCategory title='Databases' items={TECH_STACK.databases} />
                <TechCategory
                    title='Cloud & DevOps'
                    items={TECH_STACK.cloudDevOps}
                />
                <TechCategory title='Frontend' items={TECH_STACK.frontend} />
            </div>
        </div>
    );
}

export function TechStackSection() {
    const { isTechExpanded, expandTech } = useTechExpanded();
    const track = useTrack();

    const handleExpand = () => {
        if (!isTechExpanded) {
            track('tech_expand_click', { action: 'expand' });
            expandTech();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleExpand();
        }
    };

    return (
        <Section title='TECHNICAL ARSENAL' id='tech' className='py-0'>
            <div className='flex flex-col gap-3'>
                <div
                    onClick={handleExpand}
                    onKeyDown={handleKeyDown}
                    role='button'
                    tabIndex={0}
                    className={`bg-zinc-50/50 rounded-xl border border-zinc-100 transition-all duration-500 ease-in-out overflow-hidden relative group ${
                        isTechExpanded
                            ? 'p-6 ring-1 ring-zinc-200'
                            : 'cursor-pointer hover:border-zinc-300 hover:shadow-sm'
                    }`}
                >
                    {isTechExpanded ? (
                        <ExpandedTechView />
                    ) : (
                        <ScrollingTechLogos />
                    )}
                </div>

                {/* View Full Stack Button */}
                {!isTechExpanded && (
                    <button
                        onClick={handleExpand}
                        className='self-center flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:text-zinc-900 transition-colors py-2'
                    >
                        <span>View Full Stack</span>
                        <ChevronDown size={14} className='animate-bounce' />
                    </button>
                )}
            </div>
        </Section>
    );
}
