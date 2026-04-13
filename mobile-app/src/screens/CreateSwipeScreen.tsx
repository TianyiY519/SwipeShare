import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

const isWeb = Platform.OS === 'web';

// Only import DateTimePicker on native
let DateTimePicker: any = null;
if (!isWeb) {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const fmt = (d: Date) => d.toISOString().split('T')[0];
const fmtTime = (d: Date) => d.toTimeString().slice(0, 5);

export default function CreateSwipeScreen({ navigation }: any) {
  const [form, setForm] = useState({
    type: 'donation' as 'donation' | 'request',
    campus: 'RH',
    quantity: '1',
    available_date: '',
    available_time: '',
    meeting_location: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerTime, setPickerTime] = useState(new Date());

  const dateRef = useRef<any>(null);
  const timeRef = useRef<any>(null);

  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const onDateChange = (_e: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setPickerDate(date);
      update('available_date', fmt(date));
    }
  };

  const onTimeChange = (_e: any, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) {
      setPickerTime(date);
      update('available_time', fmtTime(date));
    }
  };

  const handleSubmit = async () => {
    if (!form.available_date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/swipes/listings/', { ...form, quantity: parseInt(form.quantity) || 1 });
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join('\n') || 'Failed to create listing';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.section}>Type</Text>
        <View style={s.row}>
          {(['donation', 'request'] as const).map((t) => (
            <TouchableOpacity key={t} style={[s.toggle, form.type === t && (t === 'donation' ? s.toggleGreen : s.toggleBlue)]}
              onPress={() => update('type', t)}>
              <Text style={[s.toggleText, form.type === t && s.toggleActiveText]}>
                {t === 'donation' ? '🎁 Donation' : '🙏 Request'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.section}>Campus</Text>
        <View style={s.row}>
          {(['RH', 'LC'] as const).map((c) => (
            <TouchableOpacity key={c} style={[s.toggle, form.campus === c && s.toggleMaroon]} onPress={() => update('campus', c)}>
              <Text style={[s.toggleText, form.campus === c && s.toggleActiveText]}>
                {c === 'RH' ? 'Rose Hill' : 'Lincoln Center'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.section}>Quantity</Text>
        <View style={s.row}>
          {['1', '2', '3', '4', '5'].map((n) => (
            <TouchableOpacity key={n} style={[s.qtyBtn, form.quantity === n && s.toggleMaroon]} onPress={() => update('quantity', n)}>
              <Text style={[s.qtyText, form.quantity === n && s.toggleActiveText]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.section}>Available Date *</Text>
        {isWeb ? (
          <input
            ref={dateRef}
            type="date"
            value={form.available_date}
            min={fmt(new Date())}
            onChange={(e: any) => update('available_date', e.target.value)}
            style={webInputStyle}
          />
        ) : (
          <>
            <TouchableOpacity style={s.pickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#800000" />
              <Text style={[s.pickerText, !form.available_date && s.placeholder]}>
                {form.available_date || 'Select a date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && DateTimePicker && (
              <View>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={s.doneBtn} onPress={() => setShowDatePicker(false)}>
                    <Text style={s.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        <Text style={s.section}>Around Time</Text>
        {isWeb ? (
          <input
            ref={timeRef}
            type="time"
            value={form.available_time}
            onChange={(e: any) => update('available_time', e.target.value)}
            style={webInputStyle}
          />
        ) : (
          <>
            <TouchableOpacity style={s.pickerBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#800000" />
              <Text style={[s.pickerText, !form.available_time && s.placeholder]}>
                {form.available_time || 'Select a time (optional)'}
              </Text>
            </TouchableOpacity>
            {showTimePicker && DateTimePicker && (
              <View>
                <DateTimePicker
                  value={pickerTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={s.doneBtn} onPress={() => setShowTimePicker(false)}>
                    <Text style={s.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        <Text style={s.section}>Meeting Location</Text>
        <TextInput style={s.input} placeholder="Where to meet" placeholderTextColor="#999" value={form.meeting_location} onChangeText={(v) => update('meeting_location', v)} />

        <Text style={s.section}>Notes</Text>
        <TextInput style={[s.input, s.textArea]} placeholder="Any additional info..." placeholderTextColor="#999" value={form.notes} onChangeText={(v) => update('notes', v)} multiline numberOfLines={3} />

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create Listing</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const webInputStyle: any = {
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: 14,
  fontSize: 16,
  color: '#333',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  section: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  toggleMaroon: { backgroundColor: '#800000', borderColor: '#800000' },
  toggleGreen: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  toggleBlue: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#555' },
  toggleActiveText: { color: '#fff' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#333',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#555' },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14,
  },
  pickerText: { fontSize: 16, color: '#333', fontWeight: '500' },
  placeholder: { color: '#999', fontWeight: '400' },
  doneBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 16, marginTop: 4 },
  doneBtnText: { color: '#800000', fontSize: 16, fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#800000', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
