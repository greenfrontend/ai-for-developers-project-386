import { describe, expect, it } from 'vitest';

import type { EventType } from '../api/generated/types.gen.js';
import { generateSlots } from './slots.js';

const eventType: EventType = {
  id: 'intro',
  title: 'Intro call',
  description: 'Short introduction',
  durationMinutes: 60,
};

describe('generateSlots', () => {
  it('generates a 14 day UTC workday window', () => {
    const slots = generateSlots({
      bookedStartsAt: [],
      eventType,
      now: new Date('2026-06-11T08:30:00.000Z'),
    });

    expect(slots).toHaveLength(14 * 8);
    expect(slots[0]).toEqual({
      startsAt: '2026-06-11T09:00:00.000Z',
      endsAt: '2026-06-11T10:00:00.000Z',
    });
    expect(slots.at(-1)).toEqual({
      startsAt: '2026-06-24T16:00:00.000Z',
      endsAt: '2026-06-24T17:00:00.000Z',
    });
  });

  it('does not include starts in the past for the current day', () => {
    const slots = generateSlots({
      bookedStartsAt: [],
      eventType,
      now: new Date('2026-06-11T10:15:00.000Z'),
    });

    expect(slots[0]?.startsAt).toBe('2026-06-11T11:00:00.000Z');
    expect(slots.some((slot) => slot.startsAt === '2026-06-11T10:00:00.000Z')).toBe(false);
  });

  it('uses duration as the grid step and does not cross 17:00Z', () => {
    const slots = generateSlots({
      bookedStartsAt: [],
      eventType: { ...eventType, durationMinutes: 90 },
      now: new Date('2026-06-11T08:00:00.000Z'),
    });

    expect(slots.slice(0, 5)).toEqual([
      { startsAt: '2026-06-11T09:00:00.000Z', endsAt: '2026-06-11T10:30:00.000Z' },
      { startsAt: '2026-06-11T10:30:00.000Z', endsAt: '2026-06-11T12:00:00.000Z' },
      { startsAt: '2026-06-11T12:00:00.000Z', endsAt: '2026-06-11T13:30:00.000Z' },
      { startsAt: '2026-06-11T13:30:00.000Z', endsAt: '2026-06-11T15:00:00.000Z' },
      { startsAt: '2026-06-11T15:00:00.000Z', endsAt: '2026-06-11T16:30:00.000Z' },
    ]);
    expect(slots.some((slot) => slot.endsAt === '2026-06-11T18:00:00.000Z')).toBe(false);
  });

  it('removes booked start times', () => {
    const slots = generateSlots({
      bookedStartsAt: ['2026-06-11T09:00:00Z'],
      eventType,
      now: new Date('2026-06-11T08:00:00.000Z'),
    });

    expect(slots[0]?.startsAt).toBe('2026-06-11T10:00:00.000Z');
  });

  it('returns no slots when duration cannot fit inside a workday', () => {
    const slots = generateSlots({
      bookedStartsAt: [],
      eventType: { ...eventType, durationMinutes: 600 },
      now: new Date('2026-06-11T08:00:00.000Z'),
    });

    expect(slots).toEqual([]);
  });
});
