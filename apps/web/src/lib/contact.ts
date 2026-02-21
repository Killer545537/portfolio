import { createServerFn } from '@tanstack/react-start';
import { Resend } from 'resend';

import { db } from '@/db';
import { contacts } from '@/db/schema';
import { PortfolioConnectionEmail } from '@/emails/PortfolioConnectionEmail';

interface ContactInput {
    name: string;
    email: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const submitContact = createServerFn({ method: 'POST' })
    .inputValidator((input: ContactInput): ContactInput => {
        if (!input.name || input.name.trim().length === 0) {
            throw new Error('Name is required');
        }
        if (!input.email || input.email.trim().length === 0) {
            throw new Error('Email is required');
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.email)) {
            throw new Error('Invalid email format');
        }
        return {
            name: input.name.trim(),
            email: input.email.trim(),
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
