import { randomUUID } from 'node:crypto';

import type { Booking, CreateBookingRequest, CreateEventTypeRequest, EventType, Slot } from '../api/generated/types.gen.js';
import type { BookingRepository, CreateBookingResult, CreateEventTypeResult } from '../domain.js';
import { addMinutes, toIsoString } from './time.js';
import { generateSlots, getSlotWindow, isOfferedSlot, normalizeSlotStart } from './slots.js';

export type BookingService = ReturnType<typeof createBookingService>;

export function createBookingService(params: {
  now: () => Date;
  repository: BookingRepository;
}) {
  const { now, repository } = params;

  return {
    async createBooking(request: CreateBookingRequest): Promise<CreateBookingResult> {
      const eventType = await repository.findEventType(request.eventTypeId);

      if (!eventType) {
        return { status: 'not_found' };
      }

      const normalizedStartsAt = normalizeSlotStart(request.startsAt);

      if (!normalizedStartsAt) {
        return { status: 'invalid_slot' };
      }

      if (await repository.hasBookingAt(normalizedStartsAt)) {
        return { status: 'conflict' };
      }

      const currentTime = now();
      const { startInclusive, endExclusive } = getSlotWindow(currentTime);
      const windowBookings = await repository.listBookingsBetween(
        toIsoString(startInclusive),
        toIsoString(endExclusive),
      );

      if (
        !isOfferedSlot({
          bookings: windowBookings,
          eventType,
          now: currentTime,
          startsAt: normalizedStartsAt,
        })
      ) {
        return { status: 'invalid_slot' };
      }

      const startsAtDate = new Date(normalizedStartsAt);
      const endsAt = toIsoString(addMinutes(startsAtDate, eventType.durationMinutes));
      const bookingId = randomUUID();
      const createResult = await repository.createBooking({
        id: bookingId,
        eventTypeId: eventType.id,
        startsAt: normalizedStartsAt,
        endsAt,
        guestName: request.guestName,
        guestEmail: request.guestEmail,
      });

      if (createResult === 'conflict') {
        return { status: 'conflict' };
      }

      return {
        status: 'created',
        booking: {
          id: bookingId,
          eventTypeId: eventType.id,
          eventTypeTitle: eventType.title,
          startsAt: normalizedStartsAt,
          endsAt,
          guestName: request.guestName,
          guestEmail: request.guestEmail,
        },
      };
    },

    async createEventType(request: CreateEventTypeRequest): Promise<CreateEventTypeResult> {
      const eventType: EventType = {
        id: request.id,
        title: request.title,
        description: request.description,
        durationMinutes: request.durationMinutes,
      };
      const result = await repository.createEventType(eventType);

      return result === 'conflict'
        ? { status: 'conflict' }
        : { status: 'created', eventType };
    },

    async listEventTypes(): Promise<EventType[]> {
      return repository.listEventTypes();
    },

    async listSlots(eventTypeId: string): Promise<Slot[] | undefined> {
      const eventType = await repository.findEventType(eventTypeId);

      if (!eventType) {
        return undefined;
      }

      const currentTime = now();
      const { startInclusive, endExclusive } = getSlotWindow(currentTime);
      const bookings = await repository.listBookingsBetween(
        toIsoString(startInclusive),
        toIsoString(endExclusive),
      );

      return generateSlots({
        bookedStartsAt: bookings.map((booking) => booking.startsAt),
        eventType,
        now: currentTime,
      });
    },

    async listUpcomingBookings(): Promise<Booking[]> {
      return repository.listUpcomingBookings(toIsoString(now()));
    },
  };
}
