import { createServerFn } from '@tanstack/react-start';
import { type } from 'arktype';

import { getDb } from '@/db';
import { events } from '@/db/schema';

/**
 * This endpoint is unauthenticated and writes straight to the database, so the
 * schema is the only thing standing between a visitor and arbitrary rows.
 * `eventType` is a closed set and `metadata` is capped — previously both were
 * free-form.
 */
export const TrackEventInput = type({
    eventType: type.enumerated(
        'nav_github_click',
        'nav_linkedin_click',
        'nav_twitter_click',
        'nav_qrcode_click',
        'nav_contact_click',
        'nav_markdown_toggle',
        'project_link_click',
        'experience_click',
        'experience_link_click',
        'tech_expand_click',
        'contact_submit',
    ),
    'sessionId?': 'string <= 64',
    'metadata?': type.Record(
        'string <= 40',
        'string <= 200 | number | boolean',
    ),
});

export type EventType = typeof TrackEventInput.infer.eventType;

export const trackEvent = createServerFn({ method: 'POST' })
    .inputValidator(TrackEventInput)
    .handler(async ({ data }) => {
        try {
            await getDb()
                .insert(events)
                .values({
                    source: 'web',
                    eventType: data.eventType,
                    sessionId: data.sessionId ?? null,
                    metadata: data.metadata ?? null,
                });
            return { success: true };
        } catch (error) {
            console.error('Failed to track event:', error);
            return { success: false };
        }
    });
