const CACHE_NAME = "trulexity-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl =
    new URL(event.request.url);

  /*
    IMPORTANT:
    Only handle requests belonging
    to the Trulexity website itself.

    Do NOT intercept:
    - Trulexity API
    - Firestore
    - TTS audio
    - External websites
    - External resources
  */

  if (
    requestUrl.origin !==
    self.location.origin
  ) {
    return;
  }

  event.respondWith(

    fetch(event.request)

      .catch(() =>

        caches
          .match(event.request)
          .then((cachedResponse) => {

            if (cachedResponse) {
              return cachedResponse;
            }

            return Response.error();

          })

      )

  );

});