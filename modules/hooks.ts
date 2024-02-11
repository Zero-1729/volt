// helper for React hooks
import {useRef, useEffect, useState} from 'react';

// Render count helper
export const useRenderCount = (): number => {
    const renderCount = useRef(0);
    renderCount.current += 1;

    return renderCount.current;
};

// Countdown helper
// countdown value handler
const _getTimeValues = (sec: number) => {
    // calculate time left
    const days = Math.floor(sec / (60 * 60 * 24));
    const hours = Math.floor((sec % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec - minutes * 60);

    return [days, hours, minutes, seconds];
};

export const useCountdown = (sec: number) => {
    // Initial value of timer
    const [timestamp, setTimestamp] = useState(sec);

    useEffect(() => {
        if (timestamp <= 0) {
            return;
        }

        // Update the timer every second
        const interval = setInterval(() => {
            setTimestamp(t => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return _getTimeValues(timestamp);
};
