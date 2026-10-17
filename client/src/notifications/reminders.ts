import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { isTimeKey, reminderDate } from '../study/date';
import type { StudyData } from '../study/types';

const REMINDER_CHANNEL_ID = 'study-reminders';

/**
 * Reminders need a build that ships the native module.
 *
 * `expo-notifications` has no scheduling support on web. On Android it also
 * requires its topic-subscription module eagerly (`requireNativeModule` at
 * module scope, unlike the stub the other platforms get), and Expo Go does not
 * contain that module — so merely importing the package throws there, taking
 * local notifications with it. Rather than tripping over that, reminders are
 * switched off in Expo Go on Android and the UI says why.
 */
const isSupported =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isRunningInExpoGo());

/** False where reminders cannot work at all, so the UI can explain why. */
export const remindersSupported = isSupported;

async function loadNotifications() {
  return import('expo-notifications');
}

/**
 * Foreground alerts need a handler registered up front. They are shown quietly
 * so a reminder never interrupts an active focus block by itself.
 */
export async function configureForegroundNotifications(): Promise<void> {
  if (!isSupported) {
    return;
  }

  const Notifications = await loadNotifications();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureChannel(
  Notifications: Awaited<ReturnType<typeof loadNotifications>>
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Task and event reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Asks for notification permission, returning whether reminders may be posted. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!isSupported) {
    return false;
  }

  const Notifications = await loadNotifications();
  await ensureChannel(Notifications);

  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted;
}

export function cancelReminders(): Promise<void> {
  if (!isSupported) {
    return Promise.resolve();
  }

  return enqueue(async () => {
    const Notifications = await loadNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
  });
}

/**
 * Scheduling is serialised so a slow run for stale data can never finish after
 * a newer one and leave the wrong reminders behind.
 */
let queue: Promise<void> = Promise.resolve();

function enqueue(work: () => Promise<void>): Promise<void> {
  const next = queue.catch(() => undefined).then(work);
  queue = next;

  return next;
}

async function scheduleReminders(data: StudyData): Promise<void> {
  const Notifications = await loadNotifications();
  await ensureChannel(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();

  const requests: Promise<unknown>[] = [];
  const now = Date.now();

  for (const task of data.tasks) {
    if (!task.reminderTime || !isTimeKey(task.reminderTime)) {
      continue;
    }

    const subject = data.subjects.find((item) => item.id === task.subjectId);

    if (task.date) {
      // One-off tasks (such as exam preparation) fire once on their date.
      const when = reminderDate(task.date, task.reminderTime);

      if (when.getTime() > now) {
        requests.push(
          Notifications.scheduleNotificationAsync({
            content: {
              title: task.title,
              body: subject
                ? `Time to study ${subject.name}.`
                : 'Time for your scheduled task.',
              data: { url: '/tasks' },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: when,
              channelId: REMINDER_CHANNEL_ID,
            },
          })
        );
      }

      continue;
    }

    const [hour, minute] = task.reminderTime.split(':').map(Number);

    for (const weekday of task.weekdays) {
      requests.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: task.title,
            body: subject
              ? `Time to study ${subject.name}.`
              : 'Time for your scheduled task.',
            data: { url: '/tasks' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            // The native trigger counts weekdays from 1 = Sunday.
            weekday: weekday + 1,
            hour,
            minute,
            channelId: REMINDER_CHANNEL_ID,
          },
        })
      );
    }
  }

  for (const event of data.events) {
    if (!event.reminderTime || !isTimeKey(event.reminderTime)) {
      continue;
    }

    const when = reminderDate(event.date, event.reminderTime);

    if (when.getTime() <= now) {
      continue;
    }

    requests.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: event.title,
          body: 'Your scheduled event is starting.',
          data: { url: `/calendar?date=${event.date}` },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: REMINDER_CHANNEL_ID,
        },
      })
    );
  }

  await Promise.all(requests);
}

/**
 * Replaces every scheduled reminder with the ones in `data`: a weekly reminder
 * for each weekday a task runs, and a one-off reminder for each future event.
 */
export function syncReminders(data: StudyData): Promise<void> {
  if (!isSupported) {
    return Promise.resolve();
  }

  return enqueue(() => scheduleReminders(data));
}
