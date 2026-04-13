import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

const CATEGORIES = [
  { key: 'general', label: 'General' },
  { key: 'housing', label: 'Housing' },
  { key: 'marketplace', label: 'Market' },
  { key: 'rideshare', label: 'Rides' },
  { key: 'events', label: 'Events' },
];

export default function CreatePostScreen({ navigation }: any) {
  const [form, setForm] = useState({ category: 'general', title: '', content: '' });
  const [images, setImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) { Alert.alert('Limit', 'Max 5 images'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const fd = new FormData();
        const uri = result.assets[0].uri;
        fd.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
        const res = await api.post('/api/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImages([...images, res.data.url]);
      } catch {
        Alert.alert('Error', 'Failed to upload image');
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/forum/posts/', { ...form, images, tags });
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create post';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.label}>Category</Text>
        <View style={s.row}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.key} style={[s.chip, form.category === c.key && s.chipActive]} onPress={() => update('category', c.key)}>
              <Text style={[s.chipText, form.category === c.key && s.chipActiveText]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Title *</Text>
        <TextInput style={s.input} placeholder="Post title" placeholderTextColor="#999" value={form.title} onChangeText={(v) => update('title', v)} />

        <Text style={s.label}>Content *</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          value={form.content}
          onChangeText={(v) => update('content', v)}
          multiline numberOfLines={5}
        />

        <Text style={s.label}>Tags</Text>
        <View style={s.tagInputRow}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Add a tag..."
            placeholderTextColor="#999"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
          />
          <TouchableOpacity style={s.addTagBtn} onPress={addTag}>
            <Text style={s.addTagText}>Add</Text>
          </TouchableOpacity>
        </View>
        {tags.length > 0 && (
          <View style={s.tagsRow}>
            {tags.map((t) => (
              <TouchableOpacity key={t} style={s.tagBadge} onPress={() => setTags(tags.filter((x) => x !== t))}>
                <Text style={s.tagText}>#{t} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={s.label}>Images</Text>
        <View style={s.imagesRow}>
          {images.map((url, i) => (
            <View key={i} style={s.imgWrap}>
              <Image source={{ uri: url }} style={s.imgThumb} />
              <TouchableOpacity style={s.imgRemove} onPress={() => setImages(images.filter((_, idx) => idx !== i))}>
                <Ionicons name="close-circle" size={20} color="#c62828" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={s.addImgBtn} onPress={pickImage}>
              <Ionicons name="camera" size={28} color="#800000" />
              <Text style={s.addImgText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create Post</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#333',
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
  },
  chipActive: { backgroundColor: '#800000', borderColor: '#800000' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipActiveText: { color: '#fff' },
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addTagBtn: { backgroundColor: '#800000', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16 },
  addTagText: { color: '#fff', fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagBadge: { backgroundColor: '#fce4ec', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  tagText: { fontSize: 13, color: '#800000' },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imgWrap: { position: 'relative' },
  imgThumb: { width: 80, height: 80, borderRadius: 10 },
  imgRemove: { position: 'absolute', top: -6, right: -6 },
  addImgBtn: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  addImgText: { fontSize: 11, color: '#800000', marginTop: 2 },
  submitBtn: {
    backgroundColor: '#800000', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
