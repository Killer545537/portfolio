export const GitHubHeatmap = () => {
    // Mocking 52 weeks of 7 days
    const weeks = Array.from({ length: 52 });
    const months = [
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
        'Jan',
    ];

    const getIntensityClass = (seed: number) => {
        const val = (Math.sin(seed * 0.5) + 1) / 2; // Pseudo random but deterministic
        if (val < 0.3) return 'bg-zinc-100';
        if (val < 0.6) return 'bg-emerald-200';
        if (val < 0.8) return 'bg-emerald-400';
        return 'bg-emerald-600';
    };

    return (
        <div className='w-full overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing'>
            <div className='min-w-[540px] lg:min-w-fit'>
                <div className='flex text-[10px] text-zinc-400 mb-2 gap-x-[32px] ml-4 font-mono'>
                    {months.map((m) => (
                        <span key={m}>{m}</span>
                    ))}
                </div>
                <div className='flex gap-[3px]'>
                    {weeks.map((_, i) => (
                        <div key={i} className='flex flex-col gap-[3px]'>
                            {Array.from({ length: 7 }).map((_, j) => (
                                <div
                                    key={j}
                                    className={`w-[8px] h-[8px] rounded-[1px] ${getIntensityClass(i * 7 + j)}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <div className='flex justify-between items-center mt-3 text-xs text-zinc-400 font-medium'>
                    <span>2119 contributions in 2023</span>
                    <div className='flex items-center gap-1'>
                        <span>Less</span>
                        <div className='w-[8px] h-[8px] rounded-[1px] bg-zinc-100' />
                        <div className='w-[8px] h-[8px] rounded-[1px] bg-emerald-200' />
                        <div className='w-[8px] h-[8px] rounded-[1px] bg-emerald-400' />
                        <div className='w-[8px] h-[8px] rounded-[1px] bg-emerald-600' />
                        <span>More</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
