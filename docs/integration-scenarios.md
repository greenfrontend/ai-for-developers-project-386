# Integration Scenarios

The integration suite uses Playwright to exercise the frontend and backend
together in a real browser. Tests should prefer user-facing locators and should
only rely on API calls for setup when the setup itself is not part of the
scenario.

## Main Booking Flow

Covered by `e2e/booking.spec.ts`.

1. Open the admin event type page.
2. Create a unique event type with a title, description, and duration.
3. Open the guest booking page.
4. Find the newly created event type in the event type list.
5. Open its available slots.
6. Select the first available slot.
7. Fill in guest name and email.
8. Create the booking.
9. Verify that the success notification appears.
10. Verify that the booked slot is no longer offered.
11. Open the admin bookings page.
12. Verify that the booking appears with the expected event title, guest name,
    and guest email.

## Additional Scenarios To Keep Covered

- Event type list loads successfully and shows empty state when the API returns
  no event types.
- Slot page shows empty state when no slots are available.
- Booking form blocks submission when required guest fields are missing.
- API conflict errors are shown when the selected slot is already booked.
- Admin bookings list shows upcoming bookings sorted by start time.

## Local Commands

Run the full e2e suite:

```sh
npm run test:e2e
```

Run Playwright in interactive mode:

```sh
npm run test:e2e:ui
```

The Playwright config starts the backend and frontend automatically. PostgreSQL
must be running and migrated before the tests:

```sh
docker compose up -d postgres
npm run backend:db:migrate
```
