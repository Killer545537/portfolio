import { useEffect, useRef, useState } from 'react';
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

/**
 * The form is uncontrolled and leans on native constraint validation
 * (`required`, `type="email"`), so the browser handles per-field messaging.
 * `submitContact`'s arktype schema is the single validator — the client copy
 * that used to live here could only ever agree or drift.
 */
export function ContactModal() {
    const { showContactModal, closeContactModal } = useContactModal();
    const track = useTrack();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<'emailed' | 'stored' | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        },
        [],
    );

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = new FormData(e.currentTarget);
        const name = String(form.get('name') ?? '');
        const email = String(form.get('email') ?? '');

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await submitContact({ data: { name, email } });

            if (!response.success) {
                setError(response.error ?? 'Something went wrong');
                return;
            }

            track('contact_submit');
            setResult(response.emailed ? 'emailed' : 'stored');
            closeTimer.current = setTimeout(handleClose, 2500);
        } catch {
            setError('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = null;
        closeContactModal();
        setError(null);
        setResult(null);
        setIsSubmitting(false);
    };

    return (
        <Dialog
            open={showContactModal}
            onOpenChange={(open) => !open && handleClose()}
        >
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <DialogTitle>Get in Touch</DialogTitle>
                </DialogHeader>

                {result ? (
                    <div className='flex flex-col items-center justify-center py-8 text-center'>
                        <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4'>
                            <svg
                                className='w-6 h-6 text-green-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                aria-hidden='true'
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
                            {result === 'emailed'
                                ? 'Check your inbox for a welcome email.'
                                : "I've got your details and will be in touch."}
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
                                name='name'
                                required
                                placeholder='Your name'
                                disabled={isSubmitting}
                                className='user-invalid:border-red-500'
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
                                name='email'
                                type='email'
                                required
                                placeholder='your@email.com'
                                disabled={isSubmitting}
                                className='user-invalid:border-red-500'
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
