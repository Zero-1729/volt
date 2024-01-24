// Generic helper functions

// Function to sleep and pause function execution for `ms` time
export const sleep = (ms: number = 100): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));
