import "@typespec/http";

using Http;

@service(#{ title: "Booking API" })
namespace BookingApi;

@doc("A type of event that guests can book.")
model EventType {
  id: string;
  title: string;
  description: string;
  @doc("Duration of this event type in minutes.")
  durationMinutes: int32;
}

@doc("Input used by the calendar owner to create an event type.")
model CreateEventTypeRequest {
  id: string;
  title: string;
  description: string;
  @doc("Duration of this event type in minutes.")
  durationMinutes: int32;
}

@doc("A free booking slot for a selected event type in the default 14-day booking window.")
model Slot {
  startsAt: utcDateTime;
  endsAt: utcDateTime;
}

@doc("A guest booking. The end time is calculated from the event type duration.")
model Booking {
  id: string;
  eventTypeId: string;
  startsAt: utcDateTime;
  @doc("Calculated as startsAt plus the selected event type duration.")
  endsAt: utcDateTime;
  guestName: string;
  guestEmail: string;
}

@doc("Input used by a guest to create a booking.")
model CreateBookingRequest {
  @doc("The event type selected by the guest.")
  eventTypeId: string;
  @doc("Must be one of the free slot start times for the selected event type in the default 14-day booking window.")
  startsAt: utcDateTime;
  guestName: string;
  guestEmail: string;
}

@error
model ErrorResponse {
  code: string;
  message: string;
}

model CreatedEventType {
  @statusCode _: 201;
  @body eventType: EventType;
}

model CreatedBooking {
  @statusCode _: 201;
  @body booking: Booking;
}

model BadRequestError {
  @statusCode _: 400;
  @body error: ErrorResponse;
}

model NotFoundError {
  @statusCode _: 404;
  @body error: ErrorResponse;
}

model ConflictError {
  @statusCode _: 409;
  @body error: ErrorResponse;
}

@route("/event-types")
interface EventTypes {
  @doc("List event types available to guests.")
  @get list(): EventType[];
}

@route("/event-types/{eventTypeId}/slots")
interface EventTypeSlots {
  @doc("List free slots for the selected event type for the next 14 days starting today.")
  @get list(@path eventTypeId: string): Slot[] | NotFoundError;
}

@route("/bookings")
interface Bookings {
  @doc("Create a guest booking for a free slot in the default 14-day booking window.")
  @post create(@body request: CreateBookingRequest): CreatedBooking | BadRequestError | NotFoundError | ConflictError;
}

@route("/admin/event-types")
interface AdminEventTypes {
  @doc("Create an event type for the predefined calendar owner.")
  @post create(@body request: CreateEventTypeRequest): CreatedEventType | ConflictError;
}

@route("/admin/bookings")
interface AdminBookings {
  @doc("List upcoming bookings across all event types for the predefined calendar owner.")
  @route("/upcoming")
  @get listUpcoming(): Booking[];
}
