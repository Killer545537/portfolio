import { createServerFn } from '@tanstack/react-start';
import { Resend } from 'resend';

import { getDb } from '@/db';
import { contacts } from '@/db/schema';
import { PortfolioConnectionEmail } from '@/emails/PortfolioConnectionEmail';
import { EMAIL_COPY } from './data';

export type ContactInput = { name: string; email: string };

// The pattern arktype's `string.email` keyword used. It admits no whitespace,
// so the address needs no trimming.
const EMAIL_PATTERN = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;

// The longest address SMTP can deliver to (RFC 5321 path limit).
const MAX_EMAIL_LENGTH = 254;
// The name is interpolated into the confirmation email.
const MAX_NAME_LENGTH = 100;

/**
 * Hand-written rather than a schema library: components import this module to
 * call `submitContact`, so the validator ships to the browser too. The
 * parameter type is what callers send; the checks themselves assume nothing.
 */
function parseContactInput(input: ContactInput): ContactInput {
    const value: unknown = input;
    if (typeof value !== 'object' || value === null) {
        throw new Error('Contact input must be an object');
    }

    const { name, email } = value as Record<string, unknown>;
    if (
        typeof name !== 'string' ||
        name.trim().length === 0 ||
        name.trim().length > MAX_NAME_LENGTH
    ) {
        throw new Error(
            `name must be a non-empty string of at most ${MAX_NAME_LENGTH} characters`,
        );
    }
    if (
        typeof email !== 'string' ||
        email.length > MAX_EMAIL_LENGTH ||
        !EMAIL_PATTERN.test(email)
    ) {
        throw new Error('email must be an email address');
    }

    return { name: name.trim(), email };
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's sandbox domain (onboarding@resend.dev) only delivers to the account
// owner's own address, so every visitor's email is rejected until RESEND_FROM
// points at an address on a verified domain.
const FROM =
    process.env.RESEND_FROM || 'Srijan Mahajan <onboarding@resend.dev>';

export const submitContact = createServerFn({ method: 'POST' })
    .validator(parseContactInput)
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
