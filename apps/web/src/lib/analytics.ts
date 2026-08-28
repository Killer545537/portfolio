import { createServerFn } from '@tanstack/react-start';

import { getDb } from '@/db';
import { events } from '@/db/schema';

export type EventType =
    | 'nav_github_click'
    | 'nav_linkedin_click'
    | 'nav_twitter_click'
    | 'nav_qrcode_click'
    | 'nav_contact_click'
    | 'nav_markdown_toggle'
    | 'profile_avatar_click'
    | 'project_click'
    | 'project_link_click'
    | 'experience_click'
    | 'experience_link_click'
    | 'tech_expand_click'
    | 'contact_submit'
    | 'resume_download';

interface TrackEventInput {
    eventType: EventType;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}

export const trackEvent = createServerFn({ method: 'POST' })
    .inputValidator((input: TrackEventInput): TrackEventInput => {
        if (!input.eventType) {
            throw new Error('eventType is required');
        }
        return input;
    })
    .handler(async ({ data }: { data: TrackEventInput }) => {
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
