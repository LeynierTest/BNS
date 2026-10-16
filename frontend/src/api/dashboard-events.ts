const API_URL = 'http://localhost:3000';

export type DashboardEvent = {
  type: string;
  data: unknown;
};

type DashboardEventsOptions = {
  onEvent: (event: DashboardEvent) => void;
};

export function connectDashboardEvents({
  onEvent,
}: DashboardEventsOptions): () => void {
  let stopped = false;
  let reconnectTimer: number | undefined;
  let controller: AbortController | null = null;

  const connect = async () => {
    if (stopped) {
      return;
    }

    controller = new AbortController();

    try {
      const response = await fetch(
        `${API_URL}/dashboard/events`,
        {
          credentials: 'include',
          headers: {
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(
          `SSE ${response.status}`,
        );
      }

      const reader =
        response.body.getReader();

      const decoder = new TextDecoder();
      let buffer = '';

      while (!stopped) {
        const { value, done } =
          await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const messages =
          buffer.split('\n\n');

        buffer =
          messages.pop() ?? '';

        for (const message of messages) {
          const dataLine = message
            .split('\n')
            .find(line =>
              line.startsWith('data:'),
            );

          if (!dataLine) {
            continue;
          }

          const typeLine = message
            .split('\n')
            .find(line =>
              line.startsWith('event:'),
            );

          try {
            const data =
              JSON.parse(
                dataLine
                  .slice(5)
                  .trim(),
              );

            onEvent({
              type:
                typeLine
                  ?.slice(6)
                  .trim() ?? 'message',
              data,
            });
          } catch {
            continue;
          }
        }
      }
    } catch {
      if (!stopped) {
        reconnectTimer =
          window.setTimeout(
            connect,
            3000,
          );
      }
    }
  };

  void connect();

  return () => {
    stopped = true;

    if (reconnectTimer !== undefined) {
      window.clearTimeout(
        reconnectTimer,
      );
    }

    controller?.abort();
  };
}
