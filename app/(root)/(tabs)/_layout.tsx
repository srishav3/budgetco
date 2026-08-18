import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useAuth, useUser } from '@clerk/expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const _layout = () => {

  const {user} = useUser();
  const {signOut} = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      {
        text: "Cancel", style: "cancel"
      } , {
        text : "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        }
      }
    ])
  }
  return (
    <SafeAreaView>
      <TouchableOpacity>
        <Text onPress={handleSignOut}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default _layout

const styles = StyleSheet.create({})