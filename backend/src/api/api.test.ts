import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import { InMemoryBookingRepository } from '../repositories/inMemoryBookingRepository.js';

const now = new Date('2026-06-11T08:00:00.000Z');

async function createTestApp(repository = new InMemoryBookingRepository()) {
  return buildApp({
    enableResponseValidation: true,
    frontendDistPath: false,
    now: () => now,
    repository,
  });
}

describe('Booking API', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('rejects malformed request bodies through OpenAPI validation', async () => {
    app = await createTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/admin/event-types',
      payload: {
        id: 'intro',
        title: 'Intro',
        description: 'Intro call',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('creates and lists event types', async () => {
    app = await createTestApp();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/admin/event-types',
      payload: {
        id: 'intro',
        title: 'Intro',
        description: 'Intro call',
        durationMinutes: 60,
      },
    });
    const listResponse = await app.inject({ method: 'GET', url: '/event-types' });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual({
      id: 'intro',
      title: 'Intro',
      description: 'Intro call',
      durationMinutes: 60,
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([createResponse.json()]);
  });

  it('returns 409 when event type id already exists', async () => {
    app = await createTestApp(
      new InMemoryBookingRepository([
        {
          id: 'intro',
          title: 'Intro',
          description: 'Intro call',
          durationMinutes: 60,
        },
      ]),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/admin/event-types',
      payload: {
        id: 'intro',
        title: 'Other',
        description: 'Other call',
        durationMinutes: 30,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      code: 'EVENT_TYPE_ALREADY_EXISTS',
      message: 'An event type with this id already exists.',
    });
  });

  it('returns 404 for slots of an unknown event type', async () => {
    app = await createTestApp();

    const response = await app.inject({ method: 'GET', url: '/event-types/missing/slots' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      code: 'EVENT_TYPE_NOT_FOUND',
      message: 'Event type was not found.',
    });
  });

  it('creates a booking for an offered slot and removes the slot', async () => {
    app = await createTestApp(
      new InMemoryBookingRepository([
        {
          id: 'intro',
          title: 'Intro',
          description: 'Intro call',
          durationMinutes: 60,
        },
      ]),
    );
    const slotsResponse = await app.inject({ method: 'GET', url: '/event-types/intro/slots' });
    const [slot] = slotsResponse.json();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'intro',
        startsAt: slot.startsAt,
        guestName: 'Ada Lovelace',
        guestEmail: 'ada@example.com',
      },
    });
    const nextSlotsResponse = await app.inject({ method: 'GET', url: '/event-types/intro/slots' });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      eventTypeId: 'intro',
      eventTypeTitle: 'Intro',
      startsAt: '2026-06-11T09:00:00.000Z',
      endsAt: '2026-06-11T10:00:00.000Z',
      guestName: 'Ada Lovelace',
      guestEmail: 'ada@example.com',
    });
    expect(typeof createResponse.json().id).toBe('string');
    expect(nextSlotsResponse.json().some((nextSlot: { startsAt: string }) => nextSlot.startsAt === slot.startsAt)).toBe(
      false,
    );
  });

  it('returns 400 when selected start time is not an offered slot', async () => {
    app = await createTestApp(
      new InMemoryBookingRepository([
        {
          id: 'intro',
          title: 'Intro',
          description: 'Intro call',
          durationMinutes: 60,
        },
      ]),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'intro',
        startsAt: '2026-06-11T08:00:00.000Z',
        guestName: 'Ada Lovelace',
        guestEmail: 'ada@example.com',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: 'INVALID_SLOT',
      message: 'Selected start time is not one of the available slots.',
    });
  });

  it('returns 409 when the same start is booked across event types', async () => {
    app = await createTestApp(
      new InMemoryBookingRepository([
        {
          id: 'intro',
          title: 'Intro',
          description: 'Intro call',
          durationMinutes: 60,
        },
        {
          id: 'pairing',
          title: 'Pairing',
          description: 'Pairing session',
          durationMinutes: 60,
        },
      ]),
    );
    const startsAt = '2026-06-11T09:00:00.000Z';

    await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'intro',
        startsAt,
        guestName: 'Ada Lovelace',
        guestEmail: 'ada@example.com',
      },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'pairing',
        startsAt,
        guestName: 'Grace Hopper',
        guestEmail: 'grace@example.com',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      code: 'SLOT_ALREADY_BOOKED',
      message: 'Selected start time is already booked.',
    });
  });

  it('lists upcoming bookings sorted by startsAt', async () => {
    const repository = new InMemoryBookingRepository([
      {
        id: 'intro',
        title: 'Intro',
        description: 'Intro call',
        durationMinutes: 60,
      },
    ]);
    await repository.createBooking({
      id: 'past',
      eventTypeId: 'intro',
      startsAt: '2026-06-11T07:00:00.000Z',
      endsAt: '2026-06-11T08:00:00.000Z',
      guestName: 'Past Guest',
      guestEmail: 'past@example.com',
    });
    await repository.createBooking({
      id: 'future-late',
      eventTypeId: 'intro',
      startsAt: '2026-06-11T12:00:00.000Z',
      endsAt: '2026-06-11T13:00:00.000Z',
      guestName: 'Late Guest',
      guestEmail: 'late@example.com',
    });
    await repository.createBooking({
      id: 'future-early',
      eventTypeId: 'intro',
      startsAt: '2026-06-11T10:00:00.000Z',
      endsAt: '2026-06-11T11:00:00.000Z',
      guestName: 'Early Guest',
      guestEmail: 'early@example.com',
    });
    app = await createTestApp(repository);

    const response = await app.inject({ method: 'GET', url: '/admin/bookings/upcoming' });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((booking: { id: string }) => booking.id)).toEqual([
      'future-early',
      'future-late',
    ]);
  });

  it('serves the frontend for browser routes without changing JSON API 404s', async () => {
    const frontendDistPath = await mkdtemp(join(tmpdir(), 'booking-frontend-'));
    await mkdir(join(frontendDistPath, 'assets'));
    await writeFile(join(frontendDistPath, 'index.html'), '<!doctype html><div id="root"></div>');
    app = await buildApp({
      frontendDistPath,
      repository: new InMemoryBookingRepository(),
    });

    const browserResponse = await app.inject({
      headers: { accept: 'text/html' },
      method: 'GET',
      url: '/admin/bookings',
    });
    const apiResponse = await app.inject({
      headers: { accept: 'application/json' },
      method: 'GET',
      url: '/not-an-api-route',
    });

    expect(browserResponse.statusCode).toBe(200);
    expect(browserResponse.headers['content-type']).toContain('text/html');
    expect(browserResponse.body).toContain('<div id="root"></div>');
    expect(apiResponse.statusCode).toBe(404);
    expect(apiResponse.json()).toEqual({
      code: 'NOT_FOUND',
      message: 'Route not found.',
    });
  });
});
