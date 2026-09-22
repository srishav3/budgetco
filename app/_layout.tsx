// Import Clerk's authentication provider for Expo
import { ClerkProvider } from '@clerk/expo'

// Import Clerk's token storage implementation for Expo
import { tokenCache } from '@clerk/expo/token-cache'

// Import Expo Router's placeholder for the currently active route
import { Slot } from 'expo-router'

// Read the Clerk publishable key from environment variables
const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

// Make sure the key actually exists at runtime
if (!publishableKey) {
  throw new Error(
    'Add your Clerk Publishable Key to the .env file'
  )
}

// Parent layout of the entire application
export default function RootLayout() {

  return (

    // Make Clerk authentication available
    // to the entire application
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >

      {/* Render whichever route is currently active */}
      <Slot />

    </ClerkProvider>
  )
}