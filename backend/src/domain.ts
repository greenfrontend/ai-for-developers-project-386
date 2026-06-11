import type { Booking, EventType } from './api/generated/types.gen.js';

export type BookingDraft = {
  id: string;
  eventTypeId: string;
  startsAt: string;
  endsAt: string;
  guestName: string;
  guestEmail: string;
};

export type CreateEventTypeResult =
  | { status: 'created'; eventType: EventType }
  | { status: 'conflict' };

export type CreateBookingResult =
  | { status: 'created'; booking: Booking }
  | { status: 'not_found' }
  | { status: 'invalid_slot' }
  | { status: 'conflict' };

export interface BookingRepository {
  createBooking(booking: BookingDraft): Promise<'created' | 'conflict'>;
  createEventType(eventType: EventType): Promise<'created' | 'conflict'>;
  findEventType(eventTypeId: string): Promise<EventType | undefined>;
  hasBookingAt(startsAt: string): Promise<boolean>;
  listBookingsBetween(startInclusive: string, endExclusive: string): Promise<Booking[]>;
  listEventTypes(): Promise<EventType[]>;
  listUpcomingBookings(now: string): Promise<Booking[]>;
}
