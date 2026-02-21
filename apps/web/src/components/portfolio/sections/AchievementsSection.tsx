import { Trophy } from 'lucide-react';
import { ACHIEVEMENTS } from '@/lib/data';
import { Section } from '../Section';

export function AchievementsSection() {
    return (
        <Section title='ACHIEVEMENTS' id='achievements' className='py-0'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {ACHIEVEMENTS.map((achievement) => (
                    <AchievementCard
                        key={achievement.title}
                        title={achievement.title}
                        detail={achievement.detail}
                    />
                ))}
            </div>
        </Section>
    );
}

interface AchievementCardProps {
    title: string;
    detail: string;
}

function AchievementCard({ title, detail }: AchievementCardProps) {
    return (
        <div className='group relative overflow-hidden bg-zinc-50 border border-zinc-100 rounded-xl p-6 transition-all duration-300 hover:shadow-md hover:border-zinc-200 hover:-translate-y-1'>
            <div className='absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12'>
                <Trophy size={80} className='text-zinc-900' />
            </div>
            <div className='relative z-10'>
                <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-100 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300'>
                    <Trophy size={18} className='text-zinc-700' />
                </div>
                <h3 className='font-bold text-zinc-900 text-lg mb-2 group-hover:text-black transition-colors'>
                    {title}
                </h3>
                <p className='text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-600 transition-colors'>
                    {detail}
                </p>
            </div>
        </div>
    );
}
