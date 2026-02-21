import { cn } from '@/lib/utils';

interface SectionProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    id?: string;
    className?: string;
}

export const Section: React.FC<SectionProps> = ({
    title,
    subtitle,
    children,
    id,
    className = '',
}) => (
    <section id={id} className={cn('py-12', className)}>
        {title && (
            <h2 className='text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold mb-6'>
                {title}
            </h2>
        )}
        {subtitle && (
            <p className='text-base text-zinc-500 mb-6 leading-relaxed'>
                {subtitle}
            </p>
        )}
        <div>{children}</div>
    </section>
);
