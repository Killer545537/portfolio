import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useContactModal } from '@/lib/portfolio-context';

export function ContactModal() {
    const { showContactModal, closeContactModal } = useContactModal();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        closeContactModal();
    };

    return (
        <Dialog open={showContactModal} onOpenChange={closeContactModal}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <DialogTitle>Get in Touch</DialogTitle>
                </DialogHeader>
                <form
                    className='flex flex-col gap-4 mt-4'
                    onSubmit={handleSubmit}
                >
                    <div>
                        <label
                            htmlFor='contact-name'
                            className='block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2'
                        >
                            Name
                        </label>
                        <Input id='contact-name' placeholder='Your name' />
                    </div>
                    <div>
                        <label
                            htmlFor='contact-email'
                            className='block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2'
                        >
                            Email
                        </label>
                        <Input
                            id='contact-email'
                            type='email'
                            placeholder='your@email.com'
                        />
                    </div>
                    <div>
                        <label
                            htmlFor='contact-message'
                            className='block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2'
                        >
                            Message
                        </label>
                        <Textarea
                            id='contact-message'
                            rows={4}
                            placeholder='Say hello...'
                        />
                    </div>
                    <Button type='submit' className='mt-2'>
                        Send Message
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
