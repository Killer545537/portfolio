import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Experience } from '@/lib/types';

interface ExperienceItemProps {
    exp: Experience;
}

export function ExperienceItem({ exp }: ExperienceItemProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className='mb-10 last:mb-0 group'>
            <div className='flex justify-between items-baseline mb-1'>
                <div className='flex items-center gap-2'>
                    <h3 className='font-semibold text-zinc-900 text-xl'>
                        {exp.organization}
                    </h3>
                </div>
                <span className='text-sm text-zinc-400 font-medium'>
                    {exp.location}
                </span>
            </div>
            <div className='flex justify-between items-baseline mb-4'>
                <p className='text-base font-medium text-zinc-700 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100'>
                    {exp.role}
                </p>
                <span className='text-sm text-zinc-500 font-mono'>
                    {exp.period}
                </span>
            </div>

            <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <ul className='space-y-2'>
                    {exp.description.map((desc, idx) => (
                        <li
                            key={idx}
                            className='text-base text-zinc-600 leading-relaxed font-light flex items-start gap-2'
                        >
                            <span className='block w-1 h-1 rounded-full bg-zinc-300 mt-2.5 shrink-0' />
                            <span>{desc}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className='text-xs text-zinc-400 flex items-center gap-1 hover:text-zinc-900 transition-colors mt-3 font-medium uppercase tracking-wide'
            >
                {isOpen ? 'Collapse' : 'Expand Details'}
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
        </div>
    );
}
