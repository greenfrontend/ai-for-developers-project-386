import type { ErrorResponse } from './generated/types.gen.js';

export function errorResponse(code: string, message: string): ErrorResponse {
  return { code, message };
}

export const errors = {
  eventTypeAlreadyExists: () =>
    errorResponse('EVENT_TYPE_ALREADY_EXISTS', 'An event type with this id already exists.'),
  eventTypeNotFound: () => errorResponse('EVENT_TYPE_NOT_FOUND', 'Event type was not found.'),
  invalidSlot: () =>
    errorResponse('INVALID_SLOT', 'Selected start time is not one of the available slots.'),
  slotAlreadyBooked: () =>
    errorResponse('SLOT_ALREADY_BOOKED', 'Selected start time is already booked.'),
  validation: (message: string) => errorResponse('VALIDATION_ERROR', message),
};
