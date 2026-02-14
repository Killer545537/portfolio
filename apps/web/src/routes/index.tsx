import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({ component: App });

function App() {
    return (
        <div className='flex flex-col items-center justify-center gap-4'>
            <Button>Click me</Button>
        </div>
    );
}
