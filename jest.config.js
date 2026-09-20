module.exports = {
  preset: "jest-expo",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.tsx", "**/*.test.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|lucide-react-native|nativewind|.*css|tailwind-.*))",
  ],
  setupFiles: ["./jest.setup.js"],
};
