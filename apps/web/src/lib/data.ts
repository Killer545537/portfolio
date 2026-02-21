import tomlData from '../../../../me.toml';
import type { AppData } from './types';

// Import data from TOML file - Bun supports direct TOML imports
const appData: AppData = tomlData;

export const PROFILE = appData.profile;
export const EXPERIENCES = appData.experience;
export const PROJECTS = appData.projects;
export const EDUCATION = appData.education;
export const ACHIEVEMENTS = appData.achievements;
export const TECH_STACK = appData.techStack;
export const INTERESTS = appData.interests.list;
