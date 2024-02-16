const {jest} = require('@jest/globals');

jest.mock('react-native-quick-crypto', () => ({}));
jest.mock('@breeztech/react-native-breez-sdk', () => ({}));
