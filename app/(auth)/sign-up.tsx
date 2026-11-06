import { codeSchema, SignUpFormValues, signUpSchema } from "@/lib/schemas/auth";
import { useAuth, useSignUp } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, Link } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";


export default function SignUpScreen() {
    const { signUp, errors, fetchStatus } = useSignUp();
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const isLoading = fetchStatus === "fetching";

    const {
        control,
        handleSubmit,
        formState: { errors: formErrors },
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        mode: "onBlur",
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        },
    });

    const {
        control: codeControl,
        handleSubmit: handleCodeSubmit,
        formState: { errors: codeErrors },
    } = useForm<{ code: string }>({
        resolver: zodResolver(codeSchema),
        mode: "onBlur",
        defaultValues: {
            code: "",
        },
    });

    const onSignUpPress = async (values: SignUpFormValues) => {
        setEmail(values.email);

        const { error } = await signUp.password({
            emailAddress: values.email,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
        })

        if (error) {
            console.error(JSON.stringify(error, null, 2));
            return;
        }

        if (!error) {
            await signUp.verifications.sendEmailCode();
        }
    };

    const onVerifyPress = async ({ code }: { code: string }) => {
        await signUp.verifications.verifyEmailCode({ code });

        if (signUp.status === "complete") {
            await signUp.finalize({
                navigate: ({ session, decorateUrl }) => {
                    if (session?.currentTask) {
                        return;
                    }
                    const url = decorateUrl("/");
                    router.replace(url as any);
                }
            })
        } else {
            console.error("Sign-up attempt not complete: ", signUp);
        }
    };

    if (signUp.status === "complete" || isSignedIn) {
        return null;
    }

    if (
        signUp.status === "missing_requirements" &&
        signUp.unverifiedFields.includes("email_address") &&
        signUp.missingFields.length === 0
    ) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-[#F5F5F0]"
            >
                <View className="flex-1 justify-center px-6 -mt-16">
                    <Image
                        source={require("../../assets/images/budgetco.png")}
                        className="w-36 h-16 mb-8"
                        resizeMode="contain"
                    />

                    <Text className="text-3xl font-bold text-[#1A1D26] mb-2 leading-9">
                        Verify your account
                    </Text>

                    <Text className="text-[#6B7280] text-base mb-8">
                        We sent a code to {email}
                    </Text>

                    <Controller
                        control={codeControl}
                        name="code"
                        render={({ field: { value, onChange } }) => {
                            return (
                                <TextInput
                                    className="border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 mb-2 text-[#1A1D26]"
                                    placeholder="Enter verification code"
                                    placeholderTextColor="#8A8D96"
                                    value={value}
                                    onChangeText={onChange}
                                />
                            );
                        }}
                    />

                    {codeErrors.code && (
                        <Text className="text-[#FF6B6B] mb-4 text-sm">
                            {codeErrors.code?.message}
                        </Text>
                    )}

                    {errors.fields.code && (
                        <Text className="text-[#FF6B6B] mb-4 text-sm">
                            {errors.fields.code?.message}
                        </Text>
                    )}

                    <TouchableOpacity
                        onPress={handleCodeSubmit(onVerifyPress)}
                        disabled={isLoading}
                        className="w-full bg-[#3B82F6] py-4 rounded-xl items-center mb-4"
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-semibold text-base">
                                Verify
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => signUp.verifications.sendEmailCode()}
                        className="py-2"
                    >
                        <Text className="text-[#3B82F6] text-sm">
                            I need a new code
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => signUp.reset()}
                        className="py-2"
                    >
                        <Text className="text-[#3B82F6] text-sm">
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
            className="flex-1 bg-[#F5F4F0]"
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 24,
                    paddingTop: 50,
                    paddingBottom: 40,
                }}
            >
                {/* Logo + Heading */}
                <View className="items-center mb-8">
                    <Image
                        source={require("../../assets/images/budgetco.png")}
                        className="w-36 h-[90px] mb-4.5"
                        resizeMode="contain"
                    />

                    <Text className="text-3xl leading-9 font-bold text-[#1A1D26] mb-2 text-center">
                        Create Account
                    </Text>

                    <Text className="text-base leading-6 text-[#5C5F68] text-center">
                        Track your money, powered by AI
                    </Text>
                </View>

                {/* Form */}
                <View className="w-full">
                    {/* First + Last Name */}
                    <View className="flex-row gap-3 mb-4">
                        <Controller
                            control={control}
                            name="firstName"
                            render={({ field: { value, onChange } }) => (
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-[#1A1D26] mb-1.5">
                                        First Name
                                    </Text>

                                    <TextInput
                                        className="h-[52px] border border-[#E8E6DF] bg-white rounded-xl px-4 text-[#1A1D26] text-[15px]"
                                        placeholder="First name"
                                        placeholderTextColor="#8A8D96"
                                        value={value}
                                        onChangeText={onChange}
                                        autoCapitalize="words"
                                    />
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="lastName"
                            render={({ field: { value, onChange } }) => (
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-[#1A1D26] mb-1.5">
                                        Last Name
                                    </Text>

                                    <TextInput
                                        className="h-[52px] border border-[#E8E6DF] bg-white rounded-xl px-4 text-[#1A1D26] text-[15px]"
                                        placeholder="Last name"
                                        placeholderTextColor="#8A8D96"
                                        value={value}
                                        onChangeText={onChange}
                                        autoCapitalize="words"
                                    />
                                </View>
                            )}
                        />
                    </View>

                    {(formErrors.firstName || formErrors.lastName) && (
                        <Text className="text-[#FF6B6B] mb-4 text-sm">
                            {formErrors.firstName?.message || formErrors.lastName?.message}
                        </Text>
                    )}

                    {/* Email */}
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { value, onChange } }) => (
                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-[#1A1D26] mb-1.5">
                                    Email
                                </Text>

                                <TextInput
                                    className="h-[52px] border border-[#E8E6DF] bg-white rounded-xl px-4 text-[#1A1D26] text-[15px]"
                                    placeholder="Enter your email"
                                    placeholderTextColor="#8A8D96"
                                    value={value}
                                    onChangeText={onChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        )}
                    />

                    {formErrors.email && (
                        <Text className="text-[#FF6B6B] mb-4 text-sm">
                            {formErrors.email?.message}
                        </Text>
                    )}

                    {errors.fields.emailAddress && (
                        <Text className="text-[#FF6B6B] mb-4 text-sm">
                            {errors.fields.emailAddress?.message}
                        </Text>
                    )}

                    {/* Password */}
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { value, onChange } }) => (
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-[#1A1D26] mb-1.5">
                                    Password
                                </Text>

                                <TextInput
                                    className="h-[52px] border border-[#E8E6DF] bg-white rounded-xl px-4 text-[#1A1D26] text-[15px]"
                                    placeholder="Create a password"
                                    placeholderTextColor="#8A8D96"
                                    value={value}
                                    onChangeText={onChange}
                                    secureTextEntry
                                />
                            </View>
                        )}
                    />

                    {formErrors.password && (
                        <Text className="text-[#FF6B6B] mb-4 text-sm">
                            {formErrors.password?.message}
                        </Text>
                    )}

                    {errors.fields.password && (
                        <Text className="text-[#FF6B6B] mb-4 text-sm">
                            {errors.fields.password?.message}
                        </Text>
                    )}

                    {/* SignUp Button */}
                    <TouchableOpacity
                        onPress={handleSubmit(onSignUpPress)}
                        disabled={isLoading}
                        className="w-full bg-[#3B82F6] py-4 rounded-xl items-center mb-4"
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-semibold text-base">
                                Sign Up
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/*Sign in Link*/}
                    <View className="flex-row justify-center">
                        <Text className="text-[#6B7280]">
                            Already have an account?{' '}
                        </Text>

                        <Link href="/sign-in">
                            <Text className="text-[#3B82F6] font-semibold">
                                Sign In
                            </Text>
                        </Link>
                    </View>

                    {/* Required by Clerk for bot protection */}
                    <View nativeID="clerk-captcha" />

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}