import { getRouteApi } from '@tanstack/react-router';
import { ActivityCalendar } from 'react-activity-calendar';

const routeApi = getRouteApi('/');

export const GitHubHeatmap = () => {
    const { contributions } = routeApi.useLoaderData();

    return (
        <div className='w-full overflow-x-auto hide-scrollbar'>
            <div className='min-w-135 lg:min-w-fit'>
                <ActivityCalendar
                    data={contributions}
                    colorScheme='light'
                    blockSize={8}
                    blockMargin={3}
                    blockRadius={1}
                    fontSize={10}
                    showMonthLabels={false}
                    maxLevel={4}
                    theme={{
                        light: [
                            '#f4f4f5',
                            '#d1fae5',
                            '#6ee7b7',
                            '#34d399',
                            '#059669',
                        ],
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
            </div>
        </div>
    );
};
