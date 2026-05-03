import { Suspense } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

type Activity = {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
};

type ApiResponse = {
    contributions: Activity[];
};

type Resource<T> = {
    read: () => T;
};

const USERNAME = 'Killer545537';
const YEAR = 'last';
const API_URL = 'https://github-contributions-api.jogruber.de/v4/';

const resourceCache = new Map<string, Resource<ApiResponse>>();

async function fetchCalendarData(
    username: string,
    year: string,
): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}${username}?y=${year}`);
    const data = (await response.json()) as ApiResponse & { error?: string };

    if (!response.ok) {
        throw new Error(
            `Fetching GitHub contribution data for "${username}" failed: ${
                data.error ?? 'Unknown error'
            }`,
        );
    }

    return data;
}

function getCalendarResource(username: string, year: string) {
    const cacheKey = `${username}:${year}`;
    const cached = resourceCache.get(cacheKey);
    if (cached) return cached;

    let status: 'pending' | 'success' | 'error' = 'pending';
    let result: ApiResponse;
    let error: unknown;

    const promise = fetchCalendarData(username, year)
        .then((data) => {
            status = 'success';
            result = data;
        })
        .catch((err: unknown) => {
            status = 'error';
            error = err;
        });

    const resource: Resource<ApiResponse> = {
        read: () => {
            if (status === 'pending') {
                throw promise;
            }
            if (status === 'error') {
                throw error;
            }
            return result;
        },
    };

    resourceCache.set(cacheKey, resource);
    return resource;
}

const HeatmapFallback = () => (
    <div
        aria-hidden='true'
        className='min-h-27.5 w-full rounded-lg bg-zinc-100/70 animate-pulse'
    />
);

const GitHubHeatmapContent = () => {
    const resource = getCalendarResource(USERNAME, YEAR);
    let data: ApiResponse;

    try {
        data = resource.read();
    } catch (err) {
        if (err instanceof Promise) {
            throw err;
        }

        return (
            <div className='text-sm text-zinc-400 font-mono'>
                Error – Fetching GitHub contribution data for "{USERNAME}" failed.
            </div>
        );
    }

    return (
        <ActivityCalendar
            data={data.contributions}
            colorScheme='light'
            blockSize={8}
            blockMargin={3}
            blockRadius={1}
            fontSize={10}
            showMonthLabels={false}
            maxLevel={4}
            theme={{
                light: ['#f4f4f5', '#d1fae5', '#6ee7b7', '#34d399', '#059669'],
            }}
            labels={{
                totalCount: '{{count}} contributions in {{year}}',
                legend: {
                    less: 'Less',
                    more: 'More',
                },
            }}
            style={{
                color: '#a1a1aa',
                fontFamily: 'ui-monospace, monospace',
            }}
        />
    );
};

export const GitHubHeatmap = () => (
    <div className='w-full overflow-x-auto hide-scrollbar'>
        <div className='min-w-135 lg:min-w-fit'>
            <Suspense fallback={<HeatmapFallback />}>
                <GitHubHeatmapContent />
            </Suspense>
        </div>
    </div>
);
