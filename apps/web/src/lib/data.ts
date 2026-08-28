import tomlData from '../../../../me.toml';
import type { AppData, TechCategory } from './types';

// Resolved at build time by vite-plugin-toml.
const appData: AppData = tomlData;

export const PROFILE = appData.profile;
export const EXPERIENCES = appData.experience;
export const PROJECTS = appData.projects;
export const EDUCATION = appData.education;
export const ACHIEVEMENTS = appData.achievements;
export const TECH_STACK = appData.techStack;
export const LANGUAGES_SPOKEN = appData.languagesSpoken;
export const INTERESTS = appData.interests.list;
export const EMAIL_COPY = appData.email;

/** Full origin, derived from the single `profile.site` host in me.toml. */
export const SITE_URL = `https://${PROFILE.site}`;

/**
 * Display names for the tech-stack categories. Both the rendered section and
 * the markdown view read these, so the labels can't disagree — deriving them
 * from the object keys is what turned `cloudDevOps` into "CLOUDDEVOPS".
 */
export const TECH_CATEGORY_LABELS: Record<TechCategory, string> = {
    languages: 'Languages',
    backend: 'Backend & API',
    databases: 'Databases',
    cloudDevOps: 'Cloud & DevOps',
    frontend: 'Frontend',
};
