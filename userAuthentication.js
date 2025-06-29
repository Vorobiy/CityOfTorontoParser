chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
  
    // Use the token to authorize API requests
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: 'Test Event from Extension',
        start: {
          dateTime: '2025-07-01T10:00:00-04:00',
          timeZone: 'America/Toronto'
        },
        end: {
          dateTime: '2025-07-01T11:00:00-04:00',
          timeZone: 'America/Toronto'
        }
      })
    })
    .then(response => response.json())
    .then(data => console.log('Event created:', data))
    .catch(err => console.error('Error:', err));
  });
  