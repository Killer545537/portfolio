import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(25 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className='bg-zinc-50 border border-zinc-100 rounded-xl p-8 mb-20'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xs uppercase font-semibold text-zinc-400 tracking-widest'>
                    Pomodoro Timer
                </h2>
                <button
                    type='button'
                    className='text-xs text-zinc-300 hover:text-zinc-600 uppercase font-medium'
                >
                    Adjust Time
                </button>
            </div>

            <p className='text-sm text-zinc-500 mb-8 leading-relaxed max-w-lg'>
                You've reached the end! Or have you? Before you vanish into the
                digital void, I've got a quick Pomodoro Timer to help you focus
                better on your next big thing (or just to remind you to stop
                doomscrolling).
            </p>

            <div className='flex items-end gap-12'>
                <div className='text-7xl font-bold tracking-tighter text-zinc-900'>
                    {formatTime(timeLeft)}
                    <span className='block text-xs uppercase tracking-[0.3em] font-medium text-zinc-400 mt-2'>
                        Focus Session
                    </span>
                </div>

                <div className='flex items-center gap-6 pb-6'>
                    <div className='flex flex-col items-center'>
                        <span className='text-xs text-zinc-400 font-bold mb-1'>
                            25m
                        </span>
                        <div className='w-1 h-1 bg-zinc-300 rounded-full' />
                    </div>
                    <div className='flex flex-col items-center'>
                        <span className='text-xs text-zinc-400 font-bold mb-1'>
                            5m
                        </span>
                        <div className='w-1 h-1 bg-zinc-300 rounded-full' />
                    </div>

                    <div className='flex items-center gap-3 ml-4'>
                        <Button
                            onClick={toggleTimer}
                            size='icon'
                            className='w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:scale-105 transition-transform'
                        >
                            {isActive ? (
                                <Pause size={18} fill='currentColor' />
                            ) : (
                                <Play
                                    size={18}
                                    fill='currentColor'
                                    className='ml-1'
                                />
                            )}
                        </Button>
                        <Button
                            onClick={resetTimer}
                            variant='outline'
                            size='icon'
                            className='w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors'
                        >
                            <RotateCcw size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
