/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    preset: 'react-native',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native(-.*)?|@react-native(-community)?)/)',
    ],
    watchPathIgnorePatterns: ['<rootDir>/node_modules'],
    verbose: true,
    setupFiles: ['./tests/setup.js'],
};
