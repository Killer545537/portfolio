import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTrack } from '@/lib/portfolio-context';
import type { Project } from '@/lib/types';

interface ProjectItemProps {
    project: Project;
}

export function ProjectItem({ project }: ProjectItemProps) {
    const track = useTrack();

    const handleProjectLinkClick = () => {
        track('project_link_click', {
            projectTitle: project.title,
            ...(project.link && { link: project.link }),
        });
    };

    return (
        <div className='mb-12 last:mb-0 group'>
            <div className='flex flex-col md:flex-row md:items-baseline justify-between mb-3 gap-2'>
                <h3 className='text-2xl font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors'>
                    {project.title}
                </h3>
                <div className='flex items-center gap-3'>
                    <Badge
                        variant='outline'
                        className='text-xs uppercase tracking-wider font-semibold text-zinc-400 border-zinc-200 bg-zinc-50 rounded-full'
                    >
                        {project.category}
                    </Badge>
                    {project.link && (
                        <a
                            href={project.link}
                            target='_blank'
                            rel='noreferrer'
                            onClick={handleProjectLinkClick}
                            className='text-zinc-400 hover:text-zinc-900 transition-colors'
                        >
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>
            </div>

            {project.tech && project.tech.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-4'>
                    {project.tech.map((t) => (
                        <span
                            key={t}
                            className='text-xs text-zinc-500 font-mono bg-zinc-100/80 px-1.5 py-0.5 rounded'
                        >
                            {t}
                        </span>
                    ))}
                </div>
            )}

            <ul className='space-y-2 mt-4 border-l-2 border-zinc-100 pl-4'>
                {project.highlights.map((highlight) => (
                    <li
                        key={highlight}
                        className='text-base text-zinc-600 leading-relaxed font-light'
                    >
                        {highlight}
                    </li>
                ))}
            </ul>
        </div>
    );
}
