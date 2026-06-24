import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';

const ChangePasswordScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long.');
      return;
    }
    setIsUpdating(true);
    try {
      await api.changePassword({ oldPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not change password.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Update Security</Text>
        <Text style={styles.subtitle}>
          Create a strong new password for your Tamizha Properties account.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CURRENT PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter current password"
            placeholderTextColor="#888"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            placeholderTextColor="#888"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.btn} 
          onPress={handleChangePassword}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.btnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 35,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E0AD4D',
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: '#F3E5AB',
  },
  btn: {
    backgroundColor: '#E0AD4D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#E0AD4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  btnText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 16,
  },
});

export default ChangePasswordScreen;
