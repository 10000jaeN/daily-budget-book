self.addEventListener("push", (event) => {
  if (!event.data) return;

  let title = "Daily Budget Book";
  let body = "";

  try {
    const data = event.data.json();
    title = data.title ?? title;
    body = data.body ?? "";
  } catch {
    body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/dashboard")
  );
});
