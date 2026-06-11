import {
  Alert,
  Button,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconCalendarCheck, IconSend } from '@tabler/icons-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { formatApiError } from '../api/errors';
import { bookingsCreate, eventTypeSlotsList } from '../api/generated/sdk.gen';
import type { Slot } from '../api/generated/types.gen';
import { EmptyState, ErrorState, PageLoader } from '../components/PageState';
import { formatDateTime } from '../utils/dates';

type BookingForm = {
  guestName: string;
  guestEmail: string;
};

const initialForm: BookingForm = {
  guestName: '',
  guestEmail: '',
};

export function EventTypePage() {
  const { eventTypeId = '' } = useParams();
  const decodedEventTypeId = useMemo(() => decodeURIComponent(eventTypeId), [eventTypeId]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    if (!decodedEventTypeId) {
      setLoading(false);
      setError('Event type id is missing from the route');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await eventTypeSlotsList({
      path: { eventTypeId: decodedEventTypeId },
    });

    if (result.error) {
      setError(formatApiError(result.error, 'Could not load slots'));
      setSlots([]);
    } else {
      const nextSlots = result.data ?? [];
      setSlots(nextSlots);
      setSelectedSlot(nextSlots[0]?.startsAt ?? '');
    }

    setLoading(false);
  }, [decodedEventTypeId]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!selectedSlot) {
      setSubmitError('Choose a slot before submitting the booking.');
      return;
    }

    setSubmitting(true);

    const result = await bookingsCreate({
      body: {
        eventTypeId: decodedEventTypeId,
        startsAt: selectedSlot,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
      },
    });

    if (result.error) {
      setSubmitError(formatApiError(result.error, 'Could not create booking'));
    } else {
      notifications.show({
        color: 'teal',
        icon: <IconCalendarCheck size={18} />,
        message: result.data
          ? `Booking created for ${formatDateTime(result.data.startsAt)}`
          : 'Booking created.',
        title: 'Booking created',
      });
      setForm(initialForm);
      await loadSlots();
    }

    setSubmitting(false);
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={1}>Available slots</Title>
          <Text c="dimmed">Event type: {decodedEventTypeId}</Text>
        </Stack>
        <Button component={Link} to="/" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          Back
        </Button>
      </Group>

      {loading ? <PageLoader label="Loading slots" /> : null}

      {!loading && error ? <ErrorState message={error} onRetry={loadSlots} /> : null}

      {!loading && !error && slots.length === 0 ? (
        <EmptyState
          title="No free slots"
          description="This event type has no available slots in the API response."
        />
      ) : null}

      {!loading && !error && slots.length > 0 ? (
        <Paper withBorder p="lg" radius="sm">
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <Radio.Group
                label="Slot"
                value={selectedSlot}
                onChange={setSelectedSlot}
                withAsterisk
              >
                <Stack gap="xs" mt="xs">
                  {slots.map((slot) => (
                    <Radio
                      key={slot.startsAt}
                      value={slot.startsAt}
                      label={`${formatDateTime(slot.startsAt)} - ${formatDateTime(slot.endsAt)}`}
                    />
                  ))}
                </Stack>
              </Radio.Group>

              <Group grow align="flex-start">
                <TextInput
                  label="Guest name"
                  value={form.guestName}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    setForm((current) => ({ ...current, guestName: value }));
                  }}
                  required
                />
                <TextInput
                  label="Guest email"
                  type="email"
                  value={form.guestEmail}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    setForm((current) => ({ ...current, guestEmail: value }));
                  }}
                  required
                />
              </Group>

              {submitError ? (
                <Alert color="red" variant="light">
                  {submitError}
                </Alert>
              ) : null}

              <Button type="submit" loading={submitting} leftSection={<IconSend size={16} />}>
                Create booking
              </Button>
            </Stack>
          </form>
        </Paper>
      ) : null}
    </Stack>
  );
}
