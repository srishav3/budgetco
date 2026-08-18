import { codeSchema, SignUpFormValues, signUpSchema } from "@/lib/schemas/auth";
import { useAuth, useSignUp } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, Link } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    KeyboardAvoidingView,
    Platform,
    View,
    Image,
    Text,
    TextInput,
    ScrollView,
} from "react-native";
import { TouchableOpacity, ActivityIndicator } from "react-native";


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

                    <Text
                        style={{
                            color: "#6B7280",
                            fontSize: 16,
                            marginBottom: 32,
                        }}
                    >
                        We sent a code to {email}
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
                            {codeErrors.code?.message}
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
                            {errors.fields.code?.message}
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
                        onPress={() => signUp.verifications.sendEmailCode()}
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
                        onPress={() => signUp.reset()}
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
                backgroundColor: "#F5F4F0",
            }}
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
                <View
                    style={{
                        alignItems: "center",
                        marginBottom: 32,
                    }}
                >
                    <Image
                        source={require("../../assets/images/budgetco.png")}
                        style={{
                            width: 144,
                            height: 90,
                            marginBottom: 18,
                        }}
                        resizeMode="contain"
                    />

                    <Text
                        style={{
                            fontSize: 30,
                            lineHeight: 36,
                            fontWeight: "700",
                            color: "#1A1D26",
                            marginBottom: 8,
                            textAlign: "center",
                        }}
                    >
                        Create Account
                    </Text>

                    <Text
                        style={{
                            fontSize: 16,
                            lineHeight: 24,
                            color: "#5C5F68",
                            textAlign: "center",
                        }}
                    >
                        Track your money, powered by AI
                    </Text>
                </View>

                {/* Form */}
                <View
                    style={{
                        width: "100%",
                    }}
                >
                    {/* First + Last Name */}
                    <View
                        style={{
                            flexDirection: "row",
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <Controller
                            control={control}
                            name="firstName"
                            render={({ field: { value, onChange } }) => (
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontWeight: "600",
                                            color: "#1A1D26",
                                            marginBottom: 7,
                                        }}
                                    >
                                        First Name
                                    </Text>

                                    <TextInput
                                        style={{
                                            height: 52,
                                            borderWidth: 1,
                                            borderColor: "#E8E6DF",
                                            backgroundColor: "#FFFFFF",
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            color: "#1A1D26",
                                            fontSize: 15,
                                        }}
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
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontWeight: "600",
                                            color: "#1A1D26",
                                            marginBottom: 7,
                                        }}
                                    >
                                        Last Name
                                    </Text>

                                    <TextInput
                                        style={{
                                            height: 52,
                                            borderWidth: 1,
                                            borderColor: "#E8E6DF",
                                            backgroundColor: "#FFFFFF",
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            color: "#1A1D26",
                                            fontSize: 15,
                                        }}
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
                        <Text
                            style={{
                                color: '#FF6B6B',
                                marginBottom: 16,
                                fontSize: 14,
                            }}
                        >
                            {formErrors.firstName?.message || formErrors.lastName?.message}
                        </Text>
                    )}

                    {/* Email */}
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { value, onChange } }) => (
                            <View style={{ marginBottom: 16 }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color: "#1A1D26",
                                        marginBottom: 7,
                                    }}
                                >
                                    Email
                                </Text>

                                <TextInput
                                    style={{
                                        height: 52,
                                        borderWidth: 1,
                                        borderColor: "#E8E6DF",
                                        backgroundColor: "#FFFFFF",
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        color: "#1A1D26",
                                        fontSize: 15,
                                    }}
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
                        <Text
                            style={{
                                color: '#FF6B6B',
                                marginBottom: 16,
                                fontSize: 14,
                            }}
                        >
                            {formErrors.email?.message}
                        </Text>
                    )}

                    {errors.fields.emailAddress && (
                        <Text
                            style={{
                                color: '#FF6B6B',
                                marginBottom: 16,
                                fontSize: 14,
                            }}
                        >
                            {errors.fields.emailAddress?.message}
                        </Text>
                    )}

                    {/* Password */}
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { value, onChange } }) => (
                            <View style={{ marginBottom: 24 }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color: "#1A1D26",
                                        marginBottom: 7,
                                    }}
                                >
                                    Password
                                </Text>

                                <TextInput
                                    style={{
                                        height: 52,
                                        borderWidth: 1,
                                        borderColor: "#E8E6DF",
                                        backgroundColor: "#FFFFFF",
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        color: "#1A1D26",
                                        fontSize: 15,
                                    }}
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
                        <Text
                            style={{
                                color: '#FF6B6B',
                                marginBottom: 16,
                                fontSize: 14,
                            }}
                        >
                            {formErrors.password?.message}
                        </Text>
                    )}

                    {errors.fields.password && (
                        <Text
                            style={{
                                color: '#FF6B6B',
                                marginBottom: 16,
                                fontSize: 14,
                            }}
                        >
                            {errors.fields.password?.message}
                        </Text>
                    )}

                    {/* SignUp Button */}
                    <TouchableOpacity
                        onPress={handleSubmit(onSignUpPress)}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            backgroundColor: '#3B82F6',
                            paddingVertical: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text
                                style={{
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: 16,
                                }}
                            >
                                Sign Up
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/*Sign in Link*/}
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: '#6B7280',
                            }}
                        >
                            Already have an account?{' '}
                        </Text>

                        <Link href="/sign-in">
                            <Text
                                style={{
                                    color: '#3B82F6',
                                    fontWeight: '600',
                                }}
                            >
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