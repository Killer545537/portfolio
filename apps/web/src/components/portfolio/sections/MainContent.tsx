import { useIsDesktop, useScrollProgress } from "@/lib/portfolio-context";
import { AchievementsSection } from "./AchievementsSection";
import { EducationSection } from "./EducationSection";
import { ExperienceSection } from "./ExperienceSection";
import { ProjectsSection } from "./ProjectsSection";
import { TechStackSection } from "./TechStackSection";

export function MainContent() {
	const scrollProgress = useScrollProgress();
	const isDesktop = useIsDesktop();

	return (
		<div
			className="lg:col-span-7 pt-0 lg:pt-24 pb-24 flex flex-col gap-16 lg:origin-top-left transition-all duration-75 ease-out will-change-transform"
			style={
				isDesktop
					? {
							transform: `translateX(-${scrollProgress * 20}vw)`,
							width: `calc(100% + ${scrollProgress * 15}vw)`,
						}
					: undefined
			}
		>
			<ProjectsSection />
			<TechStackSection />
			<ExperienceSection />
			<AchievementsSection />
			<EducationSection />
		</div>
	);
}
