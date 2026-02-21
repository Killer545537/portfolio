import { EXPERIENCES } from '@/lib/data';
import { ExperienceItem } from '../ExperienceItem';
import { Section } from '../Section';

export function ExperienceSection() {
    return (
        <Section
            title='PROFESSIONAL EXPERIENCE'
            id='experience'
            className='py-0'
        >
            {EXPERIENCES.map((exp, idx) => (
                <ExperienceItem key={idx} exp={exp} />
            ))}
        </Section>
    );
}
