import { type } from 'arktype';
import { useReducer } from 'react';
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

const ContactInput = type({
    name: 'string > 0',
    email: 'string.email',
});

// Field-specific errors
interface FieldErrors {
    name?: string;
    email?: string;
}

// State type for the contact form
interface ContactFormState {
    name: string;
    email: string;
    isSubmitting: boolean;
    error: string | null;
    fieldErrors: FieldErrors;
    success: boolean;
}

// Action types for the reducer
type ContactFormAction =
    | { type: 'SET_NAME'; payload: string }
    | { type: 'SET_EMAIL'; payload: string }
    | { type: 'SUBMIT_START' }
    | { type: 'SUBMIT_SUCCESS' }
    | { type: 'SUBMIT_ERROR'; payload: string }
    | { type: 'VALIDATION_ERROR'; payload: FieldErrors }
    | { type: 'CLEAR_FIELD_ERROR'; payload: keyof FieldErrors }
    | { type: 'RESET' };

const initialState: ContactFormState = {
    name: '',
    email: '',
    isSubmitting: false,
    error: null,
    fieldErrors: {},
    success: false,
};

function contactFormReducer(
    state: ContactFormState,
    action: ContactFormAction,
): ContactFormState {
    switch (action.type) {
        case 'SET_NAME':
            return {
                ...state,
                name: action.payload,
                fieldErrors: { ...state.fieldErrors, name: undefined },
            };
        case 'SET_EMAIL':
            return {
                ...state,
                email: action.payload,
                fieldErrors: { ...state.fieldErrors, email: undefined },
            };
        case 'SUBMIT_START':
            return {
                ...state,
                isSubmitting: true,
                error: null,
                fieldErrors: {},
            };
        case 'SUBMIT_SUCCESS':
            return {
                ...state,
                isSubmitting: false,
                success: true,
                name: '',
                email: '',
            };
        case 'SUBMIT_ERROR':
            return { ...state, isSubmitting: false, error: action.payload };
        case 'VALIDATION_ERROR':
            return { ...state, fieldErrors: action.payload };
        case 'CLEAR_FIELD_ERROR':
            return {
                ...state,
                fieldErrors: {
                    ...state.fieldErrors,
                    [action.payload]: undefined,
                },
            };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

export function ContactModal() {
    const { showContactModal, closeContactModal } = useContactModal();
    const track = useTrack();
    const [state, dispatch] = useReducer(contactFormReducer, initialState);

    const { name, email, isSubmitting, error, fieldErrors, success } = state;

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();

        // Client-side validation with ArkType
        const validation = ContactInput({ name, email });
        if (validation instanceof type.errors) {
            const errors: FieldErrors = {};
            for (const err of validation) {
                const path = err.path[0] as keyof FieldErrors;
                if (path === 'name') {
                    errors.name = 'Name is required';
                } else if (path === 'email') {
                    errors.email = 'Please enter a valid email address';
                }
            }
            dispatch({ type: 'VALIDATION_ERROR', payload: errors });
            return;
        }

        dispatch({ type: 'SUBMIT_START' });

        try {
            const result = await submitContact({
                data: { name, email },
            });

            if (result.success) {
                track('contact_submit', { name, email });
                dispatch({ type: 'SUBMIT_SUCCESS' });
                setTimeout(() => {
                    closeContactModal();
                    dispatch({ type: 'RESET' });
                }, 2000);
            } else {
                dispatch({
                    type: 'SUBMIT_ERROR',
                    payload: result.error ?? 'Something went wrong',
                });
            }
        } catch (_err) {
            dispatch({
                type: 'SUBMIT_ERROR',
                payload: 'Failed to submit. Please try again.',
            });
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            closeContactModal();
            dispatch({ type: 'RESET' });
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
                                onChange={(e) =>
                                    dispatch({
                                        type: 'SET_NAME',
                                        payload: e.target.value,
                                    })
                                }
                                disabled={isSubmitting}
                                className={
                                    fieldErrors.name ? 'border-red-500' : ''
                                }
                            />
                            {fieldErrors.name && (
                                <p className='text-red-500 text-sm mt-1'>
                                    {fieldErrors.name}
                                </p>
                            )}
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
                                placeholder='your@email.com'
                                value={email}
                                onChange={(e) =>
                                    dispatch({
                                        type: 'SET_EMAIL',
                                        payload: e.target.value,
                                    })
                                }
                                disabled={isSubmitting}
                                className={
                                    fieldErrors.email ? 'border-red-500' : ''
                                }
                            />
                            {fieldErrors.email && (
                                <p className='text-red-500 text-sm mt-1'>
                                    {fieldErrors.email}
                                </p>
                            )}
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
