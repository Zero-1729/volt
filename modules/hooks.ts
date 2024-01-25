// helper for React hooks
import {useRef} from 'react';

// Render count helper
export const useRenderCount = (): number => {
    const renderCount = useRef(0);
    renderCount.current += 1;

    return renderCount.current;
};
