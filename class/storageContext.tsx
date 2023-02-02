// Import all data for use with Realm
// Include all data intended to use for context throughout App lifecycle
// export common reffed data in screens
import React, {createContext} from 'react';

// Note: context 'value' will default to '{}' if no Provider is found
export const AppStorageContext = createContext({});
export const AppStorageProvider = ({children}) => {
    // Defaults

    // States and async storage get and setters

    // Create functions for getting, setting, and other data manipulation

    // Add effects

    // Return provider
    return (
        <AppStorageContext.Provider value={{}}>
            {children}
        </AppStorageContext.Provider>
    );
};
