import type { RouteHandlers } from './generated/fastify.gen.js';
import { errors } from './errors.js';
import type { BookingService } from '../services/bookingService.js';

export function createRouteHandlers(service: BookingService): RouteHandlers {
  return {
    async adminBookingsListUpcoming(_request, reply) {
      return reply.code(200).send(await service.listUpcomingBookings());
    },

    async adminEventTypesCreate(request, reply) {
      const result = await service.createEventType(request.body);

      if (result.status === 'conflict') {
        return reply.code(409).send(errors.eventTypeAlreadyExists());
      }

      return reply.code(201).send(result.eventType);
    },

    async bookingsCreate(request, reply) {
      const result = await service.createBooking(request.body);

      switch (result.status) {
        case 'created':
          return reply.code(201).send(result.booking);
        case 'not_found':
          return reply.code(404).send(errors.eventTypeNotFound());
        case 'invalid_slot':
          return reply.code(400).send(errors.invalidSlot());
        case 'conflict':
          return reply.code(409).send(errors.slotAlreadyBooked());
      }
    },

    async eventTypesList(_request, reply) {
      return reply.code(200).send(await service.listEventTypes());
    },

    async eventTypeSlotsList(request, reply) {
      const slots = await service.listSlots(request.params.eventTypeId);

      if (!slots) {
        return reply.code(404).send(errors.eventTypeNotFound());
      }

      return reply.code(200).send(slots);
    },
  };
}

export function toOpenApiServiceHandlers(handlers: RouteHandlers) {
  return {
    AdminBookings_listUpcoming: handlers.adminBookingsListUpcoming,
    AdminEventTypes_create: handlers.adminEventTypesCreate,
    Bookings_create: handlers.bookingsCreate,
    EventTypes_list: handlers.eventTypesList,
    EventTypeSlots_list: handlers.eventTypeSlotsList,
  };
}
