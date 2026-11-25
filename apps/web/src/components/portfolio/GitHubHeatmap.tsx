import { type ComponentType, lazy, Suspense, useEffect, useState } from 'react';
import {
    type Activity,
    getGitHubContributions,
} from '@/lib/github-contributions';

const loadCalendar = () => import('./GitHubCalendar');

// A failed chunk load leaves the box empty instead of reaching the route's
// error boundary and taking the whole page down with it.
const GitHubCalendar = lazy<ComponentType<{ data: Activity[] }>>(() =>
    loadCalendar().catch(() => ({ default: () => null })),
);

// Rendered height of GitHubCalendar: 7 rows of 8px blocks with 3px gaps, the
// library's 8px gap and 1px top padding, and the 15px footer line. Reserving it
// keeps the column from shifting when the data arrives.
const CALENDAR_HEIGHT = 98;

/**
 * The page is prerendered at build time, so the contributions are fetched after
 * hydration rather than in the route loader: the rest of the page never waits
 * on the third-party API, and a stale year of activity is never baked into the
 * HTML.
 */
export function GitHubHeatmap() {
    // null while loading; empty when the server had nothing to give.
    const [contributions, setContributions] = useState<Activity[] | null>(null);

    useEffect(() => {
        let cancelled = false;

        // Fetch the chunk alongside the data rather than after it.
        loadCalendar().catch(() => {});

        getGitHubContributions()
            .then(
                (response) => response.contributions,
                () => [],
            )
            .then((data) => {
                if (!cancelled) setContributions(data);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className='w-full overflow-x-auto hide-scrollbar'>
            <div
                className='min-w-135 lg:min-w-fit'
                style={{ minHeight: CALENDAR_HEIGHT }}
            >
                {contributions === null ? null : contributions.length === 0 ? (
                    <p className='text-xs text-zinc-400 font-mono'>
                        Activity is unavailable right now.
                    </p>
                ) : (
                    <Suspense fallback={null}>
                        <GitHubCalendar data={contributions} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
