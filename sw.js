/* sw.js – background service-worker (Manifest V3) */

console.log("SW loaded, waiting for messages");


async function getGoogleToken(interactive = false) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, token => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.cmd !== "addEvents") return;

  (async () => {
    try {
      const token = await getGoogleToken(true);
      const url   = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

      for (const ev of msg.events) {
        const res = await fetch(url, {
          method:  "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(ev)
        });
        if (!res.ok) throw new Error(`Calendar API: ${res.status}`);
      }

      console.log(`✔ Pushed ${msg.events.length} events to Calendar`);
      sendResponse({ ok: true });
    } catch (err) {
      console.error("Calendar push failed:", err);
      sendResponse({ ok: false, error: err?.message });
    }
  })();

  // keep the message port open for the async work above
  return true;
});
