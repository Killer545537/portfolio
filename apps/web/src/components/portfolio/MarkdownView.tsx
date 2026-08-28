import {
    ACHIEVEMENTS,
    EDUCATION,
    EXPERIENCES,
    PROFILE,
    PROJECTS,
    TECH_CATEGORY_LABELS,
    TECH_STACK,
} from '@/lib/data';
import type { TechCategory, TechItem } from '@/lib/types';

function generateMarkdown(): string {
    return `
# ${PROFILE.name}
${PROFILE.title}
${PROFILE.location}

${PROFILE.bio.lines.join('\n\n')}

## EXPERIENCE
${EXPERIENCES.map(
    (e) => `### ${e.role} @ ${e.organization}
${e.period} | ${e.location}
${e.description.map((d) => `- ${d}`).join('\n')}`,
).join('\n\n')}

## FEATURED PROJECTS
${PROJECTS.map(
    (p) => `### ${p.title}
${p.category}
${p.highlights.map((h) => `- ${h}`).join('\n')}`,
).join('\n\n')}

## TECHNICAL ARSENAL
${Object.entries(TECH_STACK)
    .map(
        ([key, items]) =>
            `- **${TECH_CATEGORY_LABELS[key as TechCategory]}**: ${(items as TechItem[]).map((i) => i.name).join(', ')}`,
    )
    .join('\n')}

## EDUCATION
${EDUCATION.map((e) => `- **${e.degree}** @ ${e.institution} (${e.period})`).join('\n')}

## ACHIEVEMENTS
${ACHIEVEMENTS.map((a) => `- **${a.title}**: ${a.detail}`).join('\n')}
	`.trim();
}

export function MarkdownView() {
    return (
        <div className='max-w-3xl mx-auto px-6 py-24 animate-in fade-in duration-300'>
            <div className='font-mono text-base text-zinc-800 whitespace-pre-wrap leading-relaxed'>
                {generateMarkdown()}
            </div>
        </div>
    );
}
