import { openGoogleAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/design';
import { Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
    onLogin: () => void;
    onSignup: () => void;
};

export default function HomeLoggedOut({ onLogin, onSignup }: Props) {
    const { setSession } = useAuth();
    const router = useRouter();
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSignUpWithGoogle = async () => {
        setGoogleLoading(true);
        try {
            const result = await openGoogleAuth();
            if (result.token && result.user) {
                setSession(result.user, result.token);
                router.replace('/(tabs)');
                return;
            }
            if (!result.cancelled) {
                Alert.alert(
                    'Sign-in incomplete',
                    'Finish Google sign-in in the browser, or try again.'
                );
            }
        } catch (err) {
            Alert.alert('Google sign-in failed', (err as Error).message);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.container}>
                <Image
                    source={require('@/assets/images/thamel-bar.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View>
                    <Text style={styles.ctaTitle}>Get free booze with reward points.</Text>
                    <Text style={styles.ctaSubtitle}>Get started by creating your account.</Text>

                    {/* <Pressable
                        style={({ pressed }) => [
                            styles.btnTertiary,
                            pressed && styles.btnPressed,
                            googleLoading && styles.btnDisabled,
                        ]}
                        onPress={handleSignUpWithGoogle}
                        disabled={googleLoading}>
                        {googleLoading ? (
                            <ActivityIndicator size="small" color={Colors.text} />
                        ) : (
                            <Image
                                source={require('@/assets/images/google-logo.webp')}
                                style={styles.googleIcon}
                            />
                        )}
                        <Text style={styles.btnTertiaryText}>
                            {googleLoading ? 'Opening Google sign-in…' : 'Sign up with Google'}
                        </Text>
                    </Pressable> */}
                    <Pressable
                        style={({ pressed }) => [styles.btnTertiary, pressed && styles.btnPressed]}
                        onPress={() => router.push('/signup')}>
                        <Mail size={16} color={Colors.text} />
                        <Text style={styles.btnTertiaryText}>Sign up with Email</Text>
                    </Pressable>
                    <View style={styles.terms}>
                        <Text style={styles.termsText}>Already have an account?</Text>
                        <Text onPress={onLogin} style={styles.termsLink}>Log in</Text>
                    </View>
                </View>

                <Text style={styles.termsText}>By signing up, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: Spacing.xxxl,
        paddingTop: Spacing.xl,
        // justifyContent: 'space-between',
        paddingBottom: Spacing.xl,
    },
    logo: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xxl,
    },

    ctaTitle: {
        ...Typography.display,
        textAlign: 'center',
        color: Colors.text,
        marginBottom: Spacing.xl,
    },
    ctaSubtitle: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    actions: {
        gap: Spacing.md,
    },
    terms: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
        marginBottom: Dimensions.get('window').height * 0.15,
    },
    termsText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    termsLink: {
        color: Colors.primary,
    },
    divider: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    dividerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        ...Typography.caption,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    btnTertiary: {
        marginTop: Spacing.sm,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceElevated,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    googleIcon: {
        width: 16,
        height: 16,
    },
    btnTertiaryText: {
        ...Typography.button,
        color: Colors.text,
    },
    btnPrimary: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius.md,
        alignItems: 'center',
        minHeight: 52,
        justifyContent: 'center',
    },
    btnPrimaryText: {
        ...Typography.button,
        color: Colors.surface,
    },
    btnSecondary: {
        backgroundColor: Colors.surface,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius.md,
        alignItems: 'center',
        minHeight: 52,
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    btnSecondaryText: {
        ...Typography.button,
        color: Colors.text,
    },
    btnPressed: { opacity: 0.9 },
    btnDisabled: { opacity: 0.7 },
});
