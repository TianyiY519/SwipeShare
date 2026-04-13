import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'other', label: 'Other' },
];

interface Props {
  visible: boolean;
  contentType: 'post' | 'comment' | 'user' | 'swipe_listing';
  contentId: number;
  onClose: () => void;
}

export default function ReportModal({ visible, contentType, contentId, onClose }: Props) {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.post('/api/moderation/reports/', {
        content_type: contentType,
        content_id: contentId,
        reason,
        description,
      });
      Alert.alert('Report Submitted', 'Our team will review it shortly.');
      setReason('spam');
      setDescription('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Report Content</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Reason</Text>
          <View style={s.reasonList}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[s.reasonBtn, reason === r.value && s.reasonActive]}
                onPress={() => setReason(r.value)}
              >
                <Text style={[s.reasonText, reason === r.value && s.reasonActiveText]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Description (optional)</Text>
          <TextInput
            style={s.input}
            placeholder="Add details..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '80%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 8 },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd',
  },
  reasonActive: { backgroundColor: '#800000', borderColor: '#800000' },
  reasonText: { fontSize: 13, color: '#555', fontWeight: '500' },
  reasonActiveText: { color: '#fff' },
  input: {
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#333', minHeight: 80, textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#c62828', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
