import tomlData from '../../../../me.toml';
import type { AppData } from './types';

// Import data from TOML file - Bun supports direct TOML imports
export const APP_DATA: AppData = tomlData;

export const PROFILE = APP_DATA.profile;
export const EXPERIENCES = APP_DATA.experience;
export const PROJECTS = APP_DATA.projects;
export const EDUCATION = APP_DATA.education;
export const ACHIEVEMENTS = APP_DATA.achievements;
export const TECH_STACK = APP_DATA.techStack;
export const LANGUAGES = APP_DATA.languagesSpoken;
export const INTERESTS = APP_DATA.interests.list;
