import { AchievementsSection } from './AchievementsSection';
import { EducationSection } from './EducationSection';
import { ExperienceSection } from './ExperienceSection';
import { ProjectsSection } from './ProjectsSection';
import { TechStackSection } from './TechStackSection';

// The scroll-driven slide lives in styles.css under `.main-column`, keyed off
// the --scroll-progress custom property and a min-width media query.
export function MainContent() {
    return (
        <div className='main-column lg:col-span-7 pt-0 lg:pt-24 pb-24 flex flex-col gap-16 lg:origin-top-left transition-all duration-75 ease-out will-change-transform'>
            <ProjectsSection />
            <TechStackSection />
            <ExperienceSection />
            <AchievementsSection />
            <EducationSection />
        </div>
    );
}
