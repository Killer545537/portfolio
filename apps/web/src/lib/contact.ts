import { createServerFn } from '@tanstack/react-start';
import { type } from 'arktype';
import { Resend } from 'resend';

import { getDb } from '@/db';
import { contacts } from '@/db/schema';
import { PortfolioConnectionEmail } from '@/emails/PortfolioConnectionEmail';
import { EMAIL_COPY } from './data';

export const ContactInput = type({
    name: type('string')
        .pipe((s) => s.trim())
        .to('string > 0'),
    email: type('string.email').pipe((s) => s.trim()),
});

export type ContactInput = typeof ContactInput.infer;

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's sandbox domain (onboarding@resend.dev) only delivers to the account
// owner's own address, so every visitor's email is rejected until RESEND_FROM
// points at an address on a verified domain.
const FROM =
    process.env.RESEND_FROM || 'Srijan Mahajan <onboarding@resend.dev>';

export const submitContact = createServerFn({ method: 'POST' })
    .inputValidator(ContactInput)
    .handler(async ({ data }) => {
        try {
            // Store contact in database
            await getDb()
                .insert(contacts)
                .values({
                    email: data.email,
                })
                .onConflictDoNothing();

            // Send email via Resend
            const { error } = await resend.emails.send({
                from: FROM,
                to: data.email,
                subject: EMAIL_COPY.subject,
                react: PortfolioConnectionEmail({ name: data.name }),
            });

            if (error) {
                console.error('Failed to send email:', error);
                // The address is recorded either way — say what actually
                // happened rather than reporting a clean success or a total
                // failure, neither of which is true.
                return { success: true, emailed: false };
            }

            return { success: true, emailed: true };
        } catch (error) {
            console.error('Contact submission failed:', error);
            return {
                success: false,
                emailed: false,
                error: 'Submission failed',
            };
        }
    });
