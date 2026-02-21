import { PROJECTS } from '@/lib/data';
import { ProjectItem } from '../ProjectItem';
import { Section } from '../Section';

export function ProjectsSection() {
    return (
        <Section title='FEATURED PROJECTS' id='projects' className='py-0'>
            {PROJECTS.map((project, idx) => (
                <ProjectItem key={idx} project={project} />
            ))}
        </Section>
    );
}
