import { useSignIn } from "@clerk/expo";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";

import { getGlobalErrorMessage, SIGN_IN_FAILED_MESSAGE } from "@/lib/clerk-errors";
import { colors } from "@/constants/theme";
import { isValidEmail } from "@/lib/validation";
import { posthog } from "@/lib/posthog";

const SafeAreaView = styled(RNSafeAreaView);

type LocalErrors = {
  email?: string;
  password?: string;
};

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localErrors, setLocalErrors] = useState<LocalErrors>({});
  const [statusError, setStatusError] = useState<string | undefined>();

  const isSubmitting = fetchStatus === "fetching";
  const emailError = localErrors.email;
  const passwordError = localErrors.password;
  const credentialsInvalid = Boolean(errors.fields.identifier || errors.fields.password);
  const formError = credentialsInvalid
    ? SIGN_IN_FAILED_MESSAGE
    : (getGlobalErrorMessage(errors.global) ?? statusError);

  const handleSignIn = async () => {
    const nextErrors: LocalErrors = {
      email: isValidEmail(email) ? undefined : "Enter a valid email address.",
      password: password.length > 0 ? undefined : "Enter your password.",
    };

    if (nextErrors.email || nextErrors.password) {
      setLocalErrors(nextErrors);
      return;
    }

    setLocalErrors({});
    setStatusError(undefined);

    const { error } = await signIn.password({ identifier: email.trim(), password });
    if (error) return;

    switch (signIn.status) {
      case "complete":
        await signIn.finalize();
        posthog?.capture("sign_in_completed");
        return;
      case "needs_second_factor":
      case "needs_client_trust":
        // Not built in this pass - see plan's non-goals (no MFA/device-trust UI yet).
        setStatusError("This account requires additional verification that isn't supported here yet.");
        return;
      default:
        setStatusError("Something went wrong. Please try again.");
    }
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurly</Text>
                <Text className="auth-wordmark-sub">SMART BILLING</Text>
              </View>
            </View>
            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">Sign in to continue managing your subscriptions</Text>
          </View>

          <View className="auth-card">
            <View className="auth-form">
              <View className="auth-field">
                <Text className="auth-label">Email</Text>
                <TextInput
                  className={clsx("auth-input", emailError && "auth-input-error")}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setLocalErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
                {emailError && <Text className="auth-error">{emailError}</Text>}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <TextInput
                  className={clsx("auth-input", passwordError && "auth-input-error")}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setLocalErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  textContentType="password"
                />
                {passwordError && <Text className="auth-error">{passwordError}</Text>}
              </View>

              {formError && <Text className="auth-error">{formError}</Text>}

              <Pressable
                className={clsx("auth-button", isSubmitting && "auth-button-disabled")}
                onPress={handleSignIn}
                disabled={isSubmitting}
              >
                <Text className="auth-button-text">{isSubmitting ? "Signing in…" : "Sign in"}</Text>
              </Pressable>

              <View className="auth-link-row">
                <Text className="auth-link-copy">New to Recurly? </Text>
                <Link href="/(auth)/sign-up" className="auth-link">
                  Create an account
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
