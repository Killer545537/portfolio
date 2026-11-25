import { createServerFn } from '@tanstack/react-start';

import { getDb } from '@/db';
import { events } from '@/db/schema';

const EVENT_TYPES = [
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
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

type MetadataValue = string | number | boolean;

export type TrackEventInput = {
    eventType: EventType;
    sessionId?: string;
    metadata?: Record<string, MetadataValue>;
};

const MAX_SESSION_ID_LENGTH = 64;
const MAX_METADATA_KEY_LENGTH = 40;
// Callers send one or two keys; without a count cap one request could still
// write an arbitrarily large row.
const MAX_METADATA_KEYS = 10;
const MAX_METADATA_STRING_LENGTH = 200;

function isMetadataValue(value: unknown): value is MetadataValue {
    switch (typeof value) {
        case 'string':
            return value.length <= MAX_METADATA_STRING_LENGTH;
        case 'number':
            return Number.isFinite(value);
        case 'boolean':
            return true;
        default:
            return false;
    }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/**
 * This endpoint is unauthenticated and writes straight to the database, so
 * this check is the only thing standing between a visitor and arbitrary rows.
 * `eventType` is a closed set and `metadata` is capped — previously both were
 * free-form.
 *
 * Hand-written rather than a schema library because components import this
 * module to call `trackEvent`, so the validator ships to the browser too. The
 * parameter type is what callers send; the checks themselves assume nothing.
 * Optional fields may be absent or `undefined` (the RPC serializer keeps
 * `undefined` properties, so `track('nav_qrcode_click')` sends one).
 */
function parseTrackEventInput(input: TrackEventInput): TrackEventInput {
    const value: unknown = input;
    if (!isPlainObject(value)) {
        throw new Error('Event input must be an object');
    }

    const { eventType, sessionId, metadata } = value;

    if (!EVENT_TYPES.includes(eventType as EventType)) {
        throw new Error('eventType is not a known event');
    }

    if (
        sessionId !== undefined &&
        (typeof sessionId !== 'string' ||
            sessionId.length > MAX_SESSION_ID_LENGTH)
    ) {
        throw new Error(
            `sessionId must be a string of at most ${MAX_SESSION_ID_LENGTH} characters`,
        );
    }

    let parsedMetadata: Record<string, MetadataValue> | undefined;
    if (metadata !== undefined) {
        if (!isPlainObject(metadata)) {
            throw new Error('metadata must be an object');
        }

        const entries = Object.entries(metadata);
        if (entries.length > MAX_METADATA_KEYS) {
            throw new Error(
                `metadata may have at most ${MAX_METADATA_KEYS} keys`,
            );
        }
        for (const [key, entry] of entries) {
            if (key.length > MAX_METADATA_KEY_LENGTH) {
                throw new Error(
                    `metadata keys must be at most ${MAX_METADATA_KEY_LENGTH} characters`,
                );
            }
            if (!isMetadataValue(entry)) {
                throw new Error(
                    `metadata values must be booleans, finite numbers or strings of at most ${MAX_METADATA_STRING_LENGTH} characters`,
                );
            }
        }
        // fromEntries defines own properties, so a `__proto__` key stays data.
        parsedMetadata = Object.fromEntries(entries) as Record<
            string,
            MetadataValue
        >;
    }

    return {
        eventType: eventType as EventType,
        sessionId,
        metadata: parsedMetadata,
    };
}

export const trackEvent = createServerFn({ method: 'POST' })
    .validator(parseTrackEventInput)
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
