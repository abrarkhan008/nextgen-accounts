import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

// Schedules a notification that fires at 10:00 AM on the 3rd of every month.
export async function scheduleGstReminder() {
  if (!Capacitor.isNativePlatform()) return; // only works in the installed app

  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 9001, // fixed id so re-scheduling replaces the old one instead of duplicating
        title: "GST Payment Reminder",
        body: "GST payment is due today (3rd of the month).",
        schedule: {
          on: { day: 3, hour: 10, minute: 0 },
          repeats: true,
          allowWhileIdle: true,
        },
      },
    ],
  });
}
