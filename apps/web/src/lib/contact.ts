import { createServerFn } from '@tanstack/react-start';
import { Resend } from 'resend';
import { type } from 'arktype';

import { db } from '@/db';
import { contacts } from '@/db/schema';
import { PortfolioConnectionEmail } from '@/emails/PortfolioConnectionEmail';

export const ContactInput = type({
    name: 'string > 0',
    email: 'string.email',
});

export type ContactInput = typeof ContactInput.infer;

const resend = new Resend(process.env.RESEND_API_KEY);

export const submitContact = createServerFn({ method: 'POST' })
    .inputValidator((input) => {
        const result = ContactInput(input);
        if (result instanceof type.errors) {
            throw new Error(result.summary);
        }
        return {
            name: result.name.trim(),
            email: result.email.trim(),
        };
    })
    .handler(async ({ data }: { data: ContactInput }) => {
        try {
            // Store contact in database
            await db
                .insert(contacts)
                .values({
                    email: data.email,
                })
                .onConflictDoNothing();

            // Send email via Resend
            const { error } = await resend.emails.send({
                from: 'Srijan Mahajan <onboarding@resend.dev>',
                to: data.email,
                subject: 'Thanks for connecting!',
                react: PortfolioConnectionEmail({ name: data.name }),
            });

            if (error) {
                console.error('Failed to send email:', error);
                return { success: false, error: 'Failed to send email' };
            }

            return { success: true };
        } catch (error) {
            console.error('Contact submission failed:', error);
            return { success: false, error: 'Submission failed' };
        }
    });
