import { EDUCATION } from '@/lib/data';
import { Section } from '../Section';

export function EducationSection() {
    return (
        <Section title='EDUCATION' className='py-0'>
            {EDUCATION.map((edu) => (
                <div
                    key={edu.institution}
                    className='mb-6 last:mb-0 border-b border-zinc-50 pb-6 last:border-0 last:pb-0'
                >
                    <div className='flex flex-col sm:flex-row justify-between sm:items-baseline mb-1'>
                        <h3 className='text-base font-bold text-zinc-900'>
                            {edu.institution}
                        </h3>
                        <span className='text-sm text-zinc-400 font-mono'>
                            {edu.period}
                        </span>
                    </div>
                    <div className='flex justify-between items-center'>
                        <p className='text-sm text-zinc-600 font-medium'>
                            {edu.degree}
                        </p>
                        {edu.location && (
                            <span className='text-xs text-zinc-400'>
                                {edu.location}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </Section>
    );
}
