import { useSignUp } from "@clerk/expo";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";

import { getFieldErrorMessage, getGlobalErrorMessage } from "@/lib/clerk-errors";
import { colors } from "@/constants/theme";
import { getConfirmPasswordError, getPasswordError, isValidEmail } from "@/lib/validation";
import { posthog } from "@/lib/posthog";

const SafeAreaView = styled(RNSafeAreaView);

type LocalErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  code?: string;
};

type ResendState = "idle" | "sending" | "sent" | "error";

const SignUp = () => {
  const { signUp, errors, fetchStatus } = useSignUp();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [localErrors, setLocalErrors] = useState<LocalErrors>({});
  const [resendState, setResendState] = useState<ResendState>("idle");

  const isSubmitting = fetchStatus === "fetching";
  const emailError = localErrors.email ?? getFieldErrorMessage(errors.fields.emailAddress);
  const passwordError = localErrors.password ?? getFieldErrorMessage(errors.fields.password);
  const confirmPasswordError = localErrors.confirmPassword;
  const codeError = localErrors.code ?? getFieldErrorMessage(errors.fields.code);
  const formError = getGlobalErrorMessage(errors.global);

  const handleCreateAccount = async () => {
    const nextErrors: LocalErrors = {
      email: isValidEmail(email) ? undefined : "Enter a valid email address.",
      password: getPasswordError(password),
      confirmPassword: getConfirmPasswordError(password, confirmPassword),
    };

    if (nextErrors.email || nextErrors.password || nextErrors.confirmPassword) {
      setLocalErrors(nextErrors);
      return;
    }

    setLocalErrors({});

    const { error } = await signUp.password({ emailAddress: email.trim(), password });
    if (error) return;

    if (signUp.status === "complete") {
      await signUp.finalize();
      posthog?.capture("sign_up_completed");
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) return;

    setStep("verify");
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setLocalErrors((prev) => ({ ...prev, code: "Enter the code we sent you." }));
      return;
    }

    setLocalErrors((prev) => ({ ...prev, code: undefined }));

    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (error) return;

    if (signUp.status === "complete") {
      await signUp.finalize();
      posthog?.capture("sign_up_completed");
    }
  };

  const handleResendCode = async () => {
    setResendState("sending");
    const { error } = await signUp.verifications.sendEmailCode();
    if (!error) {
      posthog?.capture("email_verification_resent");
    }
    setResendState(error ? "error" : "sent");
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
            {step === "form" ? (
              <>
                <Text className="auth-title">Create your account</Text>
                <Text className="auth-subtitle">Start tracking every subscription in one place</Text>
              </>
            ) : (
              <>
                <Text className="auth-title">Check your email</Text>
                <Text className="auth-subtitle">Enter the code we sent to {email.trim()}</Text>
              </>
            )}
          </View>

          <View className="auth-card">
            {step === "form" ? (
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
                    textContentType="newPassword"
                  />
                  {passwordError && <Text className="auth-error">{passwordError}</Text>}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Confirm password</Text>
                  <TextInput
                    className={clsx("auth-input", confirmPasswordError && "auth-input-error")}
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      setLocalErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry
                    textContentType="newPassword"
                  />
                  {confirmPasswordError && <Text className="auth-error">{confirmPasswordError}</Text>}
                </View>

                {formError && <Text className="auth-error">{formError}</Text>}

                <Pressable
                  className={clsx("auth-button", isSubmitting && "auth-button-disabled")}
                  onPress={handleCreateAccount}
                  disabled={isSubmitting}
                >
                  <Text className="auth-button-text">{isSubmitting ? "Creating account…" : "Create account"}</Text>
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Already have an account? </Text>
                  <Link href="/(auth)/sign-in" className="auth-link">
                    Sign in
                  </Link>
                </View>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={clsx("auth-input", codeError && "auth-input-error")}
                    value={code}
                    onChangeText={(value) => {
                      setCode(value);
                      setLocalErrors((prev) => ({ ...prev, code: undefined }));
                    }}
                    placeholder="Enter the 6-digit code"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                  />
                  {codeError && <Text className="auth-error">{codeError}</Text>}
                </View>

                {formError && <Text className="auth-error">{formError}</Text>}

                <Pressable
                  className={clsx("auth-button", isSubmitting && "auth-button-disabled")}
                  onPress={handleVerify}
                  disabled={isSubmitting}
                >
                  <Text className="auth-button-text">{isSubmitting ? "Verifying…" : "Verify email"}</Text>
                </Pressable>

                <Pressable
                  className="auth-secondary-button"
                  onPress={handleResendCode}
                  disabled={resendState === "sending"}
                >
                  <Text className="auth-secondary-button-text">
                    {resendState === "sending"
                      ? "Sending…"
                      : resendState === "sent"
                        ? "Code sent — check your inbox"
                        : "Resend code"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
