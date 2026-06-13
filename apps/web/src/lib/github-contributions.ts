import { createServerFn } from '@tanstack/react-start';

export type Activity = {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
};

export type ContributionsResponse = {
    contributions: Activity[];
};

const USERNAME = 'Killer545537';
const YEAR = 'last';
const API_URL = 'https://github-contributions-api.jogruber.de/v4/';

// GitHub contribution data only changes once a day, so cache it server-side
// to avoid hitting the API on every request.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cache: { data: ContributionsResponse; expiresAt: number } | null = null;

export const getGitHubContributions = createServerFn({
    method: 'GET',
}).handler(async (): Promise<ContributionsResponse> => {
    if (cache && cache.expiresAt > Date.now()) {
        return cache.data;
    }

    try {
        const response = await fetch(`${API_URL}${USERNAME}?y=${YEAR}`);
        const data = (await response.json()) as ContributionsResponse & {
            error?: string;
        };

        if (!response.ok) {
            throw new Error(data.error ?? 'Unknown error');
        }

        cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
        return data;
    } catch (err) {
        console.error(
            `Fetching GitHub contribution data for "${USERNAME}" failed:`,
            err,
        );
        return { contributions: [] };
    }
});
