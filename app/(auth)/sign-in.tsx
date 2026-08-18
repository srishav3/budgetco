import { codeSchema, SignInFormValues, signInSchema } from "@/lib/schemas/auth";
import { useSignIn } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
  } = useForm<{ code: string }>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: { code: "" },
  });

  const onSignInPress = async (values: SignInFormValues) => {
    const { error } = await signIn.password({
      emailAddress: values.email,
      password: values.password,
    });

    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl("/");
          router.replace(url as any);
        },
      });
    } else if (signIn.status === "needs_second_factor") {
      await signIn.mfa.sendPhoneCode();
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code"
      );

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    } else {
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  const onVerifyPress = async ({ code }: { code: string }) => {
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl("/");
          router.replace(url as any);
        },
      });
    } else {
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  const isLoading = fetchStatus === "fetching";

  if (signIn.status === "needs_client_trust") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: "#F5F5F0",
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            marginTop: -64,
          }}
        >
          <Image
            source={require("../../assets/images/budgetco.png")}
            style={{
              width: 144,
              height: 64,
              marginBottom: 32,
            }}
            resizeMode="contain"
          />

          <Text
            style={{
              fontSize: 30,
              fontWeight: "700",
              color: "#1A1D26",
              marginBottom: 8,
              lineHeight: 36,
            }}
          >
            Verify your account
          </Text>

          <Controller
            control={codeControl}
            name="code"
            render={({ field: { value, onChange } }) => {
              return (
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#E8E6DF",
                    backgroundColor: "white",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 8,
                    color: "#1A1D26",
                  }}
                  placeholder="Enter verification code"
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                />
              );
            }}
          />

          {codeErrors.code && (
            <Text
              style={{
                color: "#FF6B6B",
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {codeErrors.code.message}
            </Text>
          )}

          {errors.fields.code && (
            <Text
              style={{
                color: "#FF6B6B",
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {errors.fields.code.message}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleCodeSubmit(onVerifyPress)}
            disabled={isLoading}
            style={{
              width: "100%",
              backgroundColor: "#3B82F6",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  color: "white",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Verify
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => signIn.mfa.sendEmailCode()}
            style={{
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                color: "#3B82F6",
                fontSize: 14,
              }}
            >
              I need a new code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => signIn.reset()}
            style={{
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                color: "#3B82F6",
                fontSize: 14,
              }}
            >
              Start over
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
        backgroundColor: "#F5F5F0",
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          marginTop: -64,
        }}
      >
        <Image
          source={require("../../assets/images/budgetco.png")}
          style={{
            width: 200,
            height: 150,
            marginBottom: 32,
            alignSelf: "center",
          }}
          resizeMode="contain"
        />

        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            color: "#1A1D26",
            marginBottom: 8,
            lineHeight: 36,
          }}
        >
          Welcome back
        </Text>

        <Text
          style={{
            color: "#6B7280",
            fontSize: 16,
            marginBottom: 32,
          }}
        >
          Sign in to your account
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange } }) => {
            return (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E8E6DF",
                  backgroundColor: "white",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 8,
                  color: "#1A1D26",
                }}
                placeholder="Email Address"
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            );
          }}
        />

        {formErrors.email && (
          <Text
            style={{
              color: "#FF6B6B",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {formErrors.email.message}
          </Text>
        )}

        {errors.fields.identifier && (
          <Text
            style={{
              color: "#FF6B6B",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {errors.fields.identifier.message}
          </Text>
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange } }) => {
            return (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E8E6DF",
                  backgroundColor: "white",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 8,
                  color: "#1A1D26",
                }}
                placeholder="Password"
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
                secureTextEntry
              />
            );
          }}
        />

        {formErrors.password && (
          <Text
            style={{
              color: "#FF6B6B",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {formErrors.password.message}
          </Text>
        )}

        {errors.fields.password && (
          <Text
            style={{
              color: "#FF6B6B",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {errors.fields.password.message}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleSubmit(onSignInPress)}
          disabled={isLoading}
          style={{
            width: "100%",
            backgroundColor: "#3B82F6",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{
                color: "white",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#6B7280",
            }}
          >
            Dont have an account?{" "}
          </Text>

          <Link href="/sign-up">
            <Text
              style={{
                color: "#3B82F6",
                fontWeight: "600",
              }}
            >
              Sign Up
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}