import type { Booking, EventType, Slot } from '../api/generated/types.gen.js';
import { addMinutes, addUtcDays, atUtcTime, parseDateTime, startOfUtcDay, toIsoString } from './time.js';

const BOOKING_WINDOW_DAYS = 14;
const WORKDAY_START_HOUR_UTC = 9;
const WORKDAY_END_HOUR_UTC = 17;

export type SlotWindow = {
  endExclusive: Date;
  startInclusive: Date;
};

export function getSlotWindow(now: Date): SlotWindow {
  const startInclusive = startOfUtcDay(now);

  return {
    startInclusive,
    endExclusive: addUtcDays(startInclusive, BOOKING_WINDOW_DAYS),
  };
}

export function normalizeSlotStart(value: string): string | undefined {
  const date = parseDateTime(value);

  return date ? toIsoString(date) : undefined;
}

export function generateSlots(params: {
  bookedStartsAt: Iterable<string>;
  eventType: EventType;
  now: Date;
}): Slot[] {
  const { bookedStartsAt, eventType, now } = params;
  const booked = new Set(Array.from(bookedStartsAt, (startsAt) => normalizeSlotStart(startsAt)));
  const { startInclusive } = getSlotWindow(now);
  const slots: Slot[] = [];

  for (let dayOffset = 0; dayOffset < BOOKING_WINDOW_DAYS; dayOffset += 1) {
    const day = addUtcDays(startInclusive, dayOffset);
    const workdayEnd = atUtcTime(day, WORKDAY_END_HOUR_UTC);

    for (
      let startsAt = atUtcTime(day, WORKDAY_START_HOUR_UTC);
      addMinutes(startsAt, eventType.durationMinutes).getTime() <= workdayEnd.getTime();
      startsAt = addMinutes(startsAt, eventType.durationMinutes)
    ) {
      const endsAt = addMinutes(startsAt, eventType.durationMinutes);
      const startsAtIso = toIsoString(startsAt);

      if (startsAt.getTime() <= now.getTime() || booked.has(startsAtIso)) {
        continue;
      }

      slots.push({
        startsAt: startsAtIso,
        endsAt: toIsoString(endsAt),
      });
    }
  }

  return slots;
}

export function isOfferedSlot(params: {
  bookings: Booking[];
  eventType: EventType;
  now: Date;
  startsAt: string;
}): boolean {
  const normalizedStartsAt = normalizeSlotStart(params.startsAt);

  if (!normalizedStartsAt) {
    return false;
  }

  return generateSlots({
    bookedStartsAt: params.bookings.map((booking) => booking.startsAt),
    eventType: params.eventType,
    now: params.now,
  }).some((slot) => slot.startsAt === normalizedStartsAt);
}
