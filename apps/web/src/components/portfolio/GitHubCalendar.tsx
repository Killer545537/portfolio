import { ActivityCalendar } from 'react-activity-calendar';
import type { Activity } from '@/lib/github-contributions';

/**
 * Loaded lazily by GitHubHeatmap so react-activity-calendar (and the
 * date-fns/floating-ui code it pulls in) stays out of the first-paint bundle.
 * `data` must be non-empty: the library throws on an empty array.
 */
export default function GitHubCalendar({ data }: { data: Activity[] }) {
    return (
        <ActivityCalendar
            data={data}
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
}
