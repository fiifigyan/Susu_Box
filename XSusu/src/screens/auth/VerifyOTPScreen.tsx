import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOTP'>;

export function VerifyOTPScreen({ route }: Props) {
  const { verifyOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!/^\d{6}$/.test(otp)) { Alert.alert('Invalid code', 'Enter the six-digit OTP.'); return; }
    setLoading(true);
    try { await verifyOTP(route.params.email, otp); }
    catch (error) { Alert.alert('Verification failed', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setLoading(false); }
  };
  return <View style={styles.container}><Text style={styles.title}>Verify your account</Text><Text style={styles.subtitle}>Enter the code sent to {route.params.email}.</Text><TextInput style={styles.input} keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} /><TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify</Text>}</TouchableOpacity></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F9FAFB' }, title: { fontSize: 26, fontWeight: '700' }, subtitle: { color: '#6B7280', marginVertical: 12 }, input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 15, fontSize: 22, letterSpacing: 8, textAlign: 'center' }, button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 16 }, buttonText: { color: '#FFFFFF', fontWeight: '700' } });
