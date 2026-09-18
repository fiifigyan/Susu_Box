import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
export function HomeScreen() { const { user } = useAuth(); return <View style={styles.container}><Text style={styles.title}>Hello, {user?.firstName || 'there'}</Text><Text style={styles.subtitle}>Keep your contributions on track and protect your payout.</Text></View>; }
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F9FAFB' }, title: { fontSize: 28, fontWeight: '700' }, subtitle: { color: '#6B7280', fontSize: 16, marginTop: 10, lineHeight: 24 } });
