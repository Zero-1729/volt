import {Edges} from 'react-native-safe-area-context';

export const getScreenEdges = (source: string): Edges => {
    return source === 'liberal'
        ? ['top', 'bottom', 'left', 'right']
        : ['bottom', 'right', 'left'];
};
