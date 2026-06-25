import Constants from 'expo-constants';

const debuggerHost =
  Constants.expoConfig?.hostUri?.split(':')[0] ??
  Constants.manifest?.debuggerHost?.split(':')[0] ??
  'localhost';

const DEFAULT_API_URL = `http://${debuggerHost}:8000/api/v1/`;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export default API_BASE_URL;
