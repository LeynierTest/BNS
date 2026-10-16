type CoachEventType =
  | 'coach.created'
  | 'coach.updated'
  | 'coach.deleted';

export type CoachEvent = {
  type: CoachEventType;
  data: unknown;
};

type EventHandlers = {
  onEvent: (event: CoachEvent) => void;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export function connectCoachesEvents(
  handlers: EventHandlers,
): () => void {
  const controller = new AbortController();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  async function connect() {
    if (controller.signal.aborted) return;

    try {
      const response = await fetch(
        `${API_URL}/coaches/events`,
        {
          credentials: 'include',
          headers: {
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new Error(
          `SSE respondió con HTTP ${response.status}`,
        );
      }

      if (!response.body) {
        throw new Error(
          'El navegador no proporcionó un stream SSE',
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const messages = buffer.split(/\r?\n\r?\n/);
        buffer = messages.pop() ?? '';

        for (const message of messages) {
          const event = parseSseMessage(message);

          if (event) {
            handlers.onEvent(event);
          }
        }
      }

      if (!controller.signal.aborted) {
        scheduleReconnect();
      }
    } catch {
      if (!controller.signal.aborted) {
        scheduleReconnect();
      }
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer !== null) return;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, 3000);
  }

  void connect();

  return () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    controller.abort();
  };
}

function parseSseMessage(
  message: string,
): CoachEvent | null {
  let eventType = '';
  const dataLines: string[] = [];

  for (const line of message.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue;

    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (
    eventType !== 'coach.created' &&
    eventType !== 'coach.updated' &&
    eventType !== 'coach.deleted'
  ) {
    return null;
  }

  const rawData = dataLines.join('\n');
  let data: unknown = null;

  try {
    data = JSON.parse(rawData);
  } catch {
    data = rawData;
  }

  return {
    type: eventType,
    data,
  };
}
