type LogLevel = 'info' | 'warn' | 'error';

type LogPayload = {
  level: LogLevel;
  event: string;
  timestamp: string;
  [key: string]: unknown;
};

const emitLog = (payload: LogPayload): void => {
  const serialized = JSON.stringify(payload);

  if (payload.level === 'error') {
    console.error(serialized);
    return;
  }

  if (payload.level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
};

const basePayload = (level: LogLevel, event: string): LogPayload => ({
  level,
  event,
  timestamp: new Date().toISOString(),
});

export const logInfo = (
  event: string,
  meta: Record<string, unknown> = {},
): void => {
  emitLog({ ...basePayload('info', event), ...meta });
};

export const logWarn = (
  event: string,
  meta: Record<string, unknown> = {},
): void => {
  emitLog({ ...basePayload('warn', event), ...meta });
};

export const logError = (
  event: string,
  meta: Record<string, unknown> = {},
): void => {
  emitLog({ ...basePayload('error', event), ...meta });
};
