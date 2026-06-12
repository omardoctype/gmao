export async function withDevRequestTiming<T>(label: string, request: () => Promise<T>): Promise<T> {
  if (!import.meta.env.DEV) {
    return request();
  }

  const startedAt = performance.now();
  console.info(`[AI timing] ${label} started`);

  try {
    const response = await request();
    console.info(`[AI timing] ${label} completed in ${Math.round(performance.now() - startedAt)}ms`);
    return response;
  } catch (error) {
    console.info(`[AI timing] ${label} failed in ${Math.round(performance.now() - startedAt)}ms`);
    throw error;
  }
}
