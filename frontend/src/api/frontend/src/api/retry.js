// Retry reads and explicitly opted-in requests, never arbitrary writes.
export const shouldRetryRequest = (error) => {
    const config = error.config;
    if (!config || error.code === 'ERR_CANCELED' || config.signal?.aborted) return false;
    const safe = config.method?.toLowerCase() === 'get' || config.retryOnTransientError === true;
    const transient = (!error.response && Boolean(error.request)) ||
        [502, 503, 504].includes(error.response?.status);
    return safe && transient && (config.retryCount || 0) < 2;
};

export const retryDelay = (attempt) => attempt * 3000;
