import React, { createContext } from 'react';
import type { SdkEvent } from '@breeztech/breez-sdk-spark-react-native';

interface BreezEventContext {
    breezEvent: null | SdkEvent;
    setBreezEvent: (event: null | SdkEvent) => void;
    clearBreezEvent: () => void;
}

const defaultEventState = {
    breezEvent: null,
    setBreezEvent: () => {},
    clearBreezEvent: () => {},
}

const BreezEventContext = createContext<BreezEventContext>(defaultEventState);

export const BreezEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [breezEvent, updateEvent] = React.useState<null | SdkEvent>(null);

    const setBreezEvent = (event: null | SdkEvent) => {
        updateEvent(event);
    };

    const clearBreezEvent = () => {
        updateEvent(null);
    };

    return (
        <BreezEventContext.Provider value={{ breezEvent, setBreezEvent, clearBreezEvent }}>
            {children}
        </BreezEventContext.Provider>
    );
};

export const useBreezEvent = (): BreezEventContext => {
    const context = React.useContext(BreezEventContext);
    if (!context) {
        throw new Error('[Context] useBreezEvent must be used within a BreezEventProvider');
    }
    return context;
};

export default BreezEventContext;