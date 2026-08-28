// Mirrors apps/ssh/src/data.rs. Optionality must match on both sides, or one
// app will refuse data the other happily renders.

interface Contact {
    phone?: string;
    email: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
}

export interface Profile {
    name: string;
    phonetic?: string;
    title: string;
    location: string;
    /** Bare host, e.g. "srijanmahajan.me". Single source for the site's own URL. */
    site: string;
    contact: Contact;
    bio: {
        lines: string[];
    };
    avatar?: string;
}

export interface Education {
    institution: string;
    degree: string;
    period: string;
    location?: string;
}

export interface Achievement {
    title: string;
    detail: string;
}

export interface Experience {
    role: string;
    organization: string;
    location?: string;
    period: string;
    description: string[];
    link?: string;
}

export interface Project {
    title: string;
    category?: string;
    tech?: string[];
    highlights: string[];
    link?: string;
}

export interface TechItem {
    name: string;
    icon?: string;
}

export interface TechStack {
    languages: TechItem[];
    backend: TechItem[];
    databases: TechItem[];
    cloudDevOps: TechItem[];
    frontend: TechItem[];
}

export type TechCategory = keyof TechStack;

export interface Language {
    language: string;
    proficiency: string;
}

/**
 * Copy for the connection email, shared with apps/ssh/src/email.rs so the two
 * renderings cannot drift. `greeting` holds a {name} placeholder, `footer` a
 * {site} one.
 */
export interface EmailCopy {
    subject: string;
    greeting: string;
    paragraphs: string[];
    signoff: string[];
    footer: string;
}

export interface AppData {
    profile: Profile;
    education: Education[];
    achievements: Achievement[];
    experience: Experience[];
    projects: Project[];
    techStack: TechStack;
    languagesSpoken: Language[];
    interests: {
        list: string[];
    };
    email: EmailCopy;
}
