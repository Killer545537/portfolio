export interface Contact {
    phone: string;
    email: string;
    linkedin: string;
    github?: string;
    twitter?: string;
}

export interface Profile {
    name: string;
    phonetic: string;
    title: string;
    location: string;
    contact: Contact;
    bio: {
        lines: string[];
    };
    avatar: string;
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
    location: string;
    period: string;
    description: string[];
    link?: string;
}

export interface Project {
    title: string;
    category: string;
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

export interface Language {
    language: string;
    proficiency: string;
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
}
