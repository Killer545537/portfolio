import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { submitContact } from '@/lib/contact';
import { useContactModal, useTrack } from '@/lib/portfolio-context';

export function ContactModal() {
    const { showContactModal, closeContactModal } = useContactModal();
    const track = useTrack();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await submitContact({
                data: { name, email },
            });

            if (result.success) {
                track('contact_submit', { name, email });
                setSuccess(true);
                setName('');
                setEmail('');
                setTimeout(() => {
                    closeContactModal();
                    setSuccess(false);
                }, 2000);
            } else {
                setError(result.error ?? 'Something went wrong');
            }
        } catch (_err) {
            setError('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            closeContactModal();
            setError(null);
            setSuccess(false);
        }
    };

    return (
        <Dialog open={showContactModal} onOpenChange={handleOpenChange}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <DialogTitle>Get in Touch</DialogTitle>
                </DialogHeader>

                {success ? (
                    <div className='flex flex-col items-center justify-center py-8 text-center'>
                        <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-green-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M5 13l4 4L19 7'
                                />
                            </svg>
                        </div>
                        <p className='text-zinc-900 font-medium'>
                            Thanks for connecting!
                        </p>
                        <p className='text-zinc-500 text-sm mt-1'>
                            Check your inbox for a welcome email.
                        </p>
                    </div>
                ) : (
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
                            <Input
                                id='contact-name'
                                placeholder='Your name'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {error && (
                            <p className='text-red-500 text-sm'>{error}</p>
                        )}

                        <Button
                            type='submit'
                            className='mt-2'
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Connecting...' : "Let's Connect"}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
