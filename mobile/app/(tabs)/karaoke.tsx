import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/design';
import { karaokeApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PullToRefreshScrollView from '@/components/pull-to-refresh-scroll-view';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const ROOM_INFO: Record<'K1' | 'K2' | 'K3', { pricePerHour: number; capacity: number }> = {
  K1: { pricePerHour: 80, capacity: 12 },
  K2: { pricePerHour: 60, capacity: 8 },
  K3: { pricePerHour: 50, capacity: 6 },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function startOfMonth(d: Date): Date {
  const out = new Date(d);
  out.setDate(1);
  out.setHours(0, 0, 0, 0);
  return out;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/**
 * Karaoke booking – pick a date on calendar, then a slot
 */
export default function RewardsScreen() {
  const rewardOpacity = useSharedValue(0);
  const rewardTranslateY = useSharedValue(8);

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<'K1' | 'K2' | 'K3'>('K1');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [myBookings, setMyBookings] = useState<{ id: string; room: string; date: string; slot: string }[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [contactNumber, setContactNumber] = useState('');

  const { token, isLoggedIn } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  const fetchMyBookings = useCallback(() => {
    if (!token) {
      setMyBookings([]);
      return Promise.resolve();
    }
    setMyBookingsLoading(true);
    return karaokeApi
      .getMyBookings(token)
      .then((res) => setMyBookings(res.bookings))
      .catch(() => setMyBookings([]))
      .finally(() => setMyBookingsLoading(false));
  }, [token]);

  useEffect(() => {
    if (isLoggedIn && token) fetchMyBookings();
    else setMyBookings([]);
  }, [isLoggedIn, token, fetchMyBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyBookings();
    setRefreshing(false);
  }, [fetchMyBookings]);

  const dateString = useMemo(() => {
    if (!selectedDate) return null;
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || !dateString) {
      setAvailableSlots([]);
      setSlotsError(null);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    karaokeApi
      .getSlots(selectedRoom, dateString)
      .then((res) => {
        if (!cancelled) {
          setAvailableSlots(res.slots);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSlotsError(err instanceof Error ? err.message : 'Failed to load slots');
          setAvailableSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRoom, dateString, selectedDate]);

  useEffect(() => {
    if (selectedSlot && availableSlots.length > 0 && !availableSlots.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [availableSlots, selectedSlot]);

  const calendarGrid = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ type: 'empty' } | { type: 'day'; day: number; date: Date })[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ type: 'empty' });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ type: 'day', day, date: new Date(year, month, day) });
    }
    return cells;
  }, [viewMonth]);

  const calendarRows = useMemo(() => {
    const rows: ({ type: 'empty' } | { type: 'day'; day: number; date: Date })[][] = [];
    for (let i = 0; i < calendarGrid.length; i += 7) {
      rows.push(calendarGrid.slice(i, i + 7));
    }
    const lastRow = rows[rows.length - 1];
    if (lastRow && lastRow.length < 7) {
      while (lastRow.length < 7) {
        lastRow.push({ type: 'empty' });
      }
    }
    return rows;
  }, [calendarGrid]);

  const goPrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  }, []);

  const handleSelectDay = useCallback((date: Date) => {
    if (isPast(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setContactNumber('');
  }, []);

  useEffect(() => {
    rewardOpacity.value = withTiming(1, { duration: 220 });
    rewardTranslateY.value = withTiming(0, { duration: 220 });
  }, [rewardOpacity, rewardTranslateY]);

  const rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
    transform: [{ translateY: rewardTranslateY.value }],
  }));

  const handleRequestBooking = useCallback(async () => {
    if (!selectedSlot || !selectedDate || !dateString) return;
    if (!isLoggedIn || !token) {
      Alert.alert('Sign in required', 'Please sign in to book a karaoke room.');
      return;
    }
    const contactNumberTrimmed = contactNumber.trim();
    if (!contactNumberTrimmed || contactNumberTrimmed.length < 10) {
      Alert.alert('Contact number required', 'Please enter a valid contact number (at least 10 digits).');
      return;
    }
    setBookingInProgress(true);
    try {
      await karaokeApi.book(selectedRoom, dateString, selectedSlot, contactNumberTrimmed, token);
      setSelectedSlot(null);
      if (dateString) {
        const res = await karaokeApi.getSlots(selectedRoom, dateString);
        setAvailableSlots(res.slots);
      }
      fetchMyBookings();
      setContactNumber('');
      const { pricePerHour } = ROOM_INFO[selectedRoom];
      Alert.alert(
        'Booked',
        `Room ${selectedRoom} on ${selectedDate.getMonth() + 1}/${selectedDate.getDate()} at ${selectedSlot}. $${pricePerHour}/hr.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Booking failed';
      Alert.alert('Booking failed', msg);
    } finally {
      setBookingInProgress(false);
    }
  }, [selectedSlot, selectedDate, dateString, selectedRoom, isLoggedIn, token, fetchMyBookings, contactNumber]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <PullToRefreshScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}>
          <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Thamel Karaoke.</Text>
          {/* <Text style={styles.subtitle}></Text> */}
        </View>

        {isLoggedIn && (
          <View style={styles.myBookingsSection}>
            <Text style={styles.myBookingsTitle}>My bookings</Text>
            {myBookingsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.myBookingsLoader} />
            ) : myBookings.length === 0 ? (
              <Text style={styles.myBookingsEmpty}>No upcoming bookings</Text>
            ) : (
              <View style={styles.myBookingsList}>
                {myBookings.map((b) => {
                  const [y, m, d] = b.date.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const dateLabel = `${MONTHS[dateObj.getMonth()].slice(0, 3)} ${d}, ${y}`;
                  return (
                    <View key={b.id} style={styles.bookingCard}>
                      <Text style={styles.bookingRoom}>{b.room}</Text>
                      <Text style={styles.bookingDetail}>{dateLabel} · {b.slot}</Text>
                      <Text style={styles.bookingPrice}>${ROOM_INFO[b.room as 'K1' | 'K2' | 'K3']?.pricePerHour ?? 0}/hr</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <Text style={styles.myBookingsTitle}>Book a room</Text>  
        <Animated.View style={[styles.card, styles.rewardCard, rewardStyle]}>
          <View style={styles.roomTabs}>
            {(['K1', 'K2', 'K3'] as const).map((room) => {
              const selected = room === selectedRoom;
              return (
                <Pressable
                  key={room}
                  onPress={() => {
                  setSelectedRoom(room);
                  setSelectedSlot(null);
                  setContactNumber('');
                }}
                  style={({ pressed }) => [
                    styles.roomTab,
                    selected && styles.roomTabSelected,
                    pressed && styles.roomTabPressed,
                  ]}>
                  <View>
                    <Text
                      style={[
                        styles.roomTabText,
                        selected && styles.roomTabTextSelected,
                      ]}>
                      {room}
                    </Text>
                    <Text style={styles.roomTabMeta}>
                      {ROOM_INFO[room].capacity} people
                    </Text>
                    <Text style={styles.roomTabMeta}>
                      ${ROOM_INFO[room].pricePerHour}/hr
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Pick a date</Text>

          <View style={styles.calendar}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={goPrevMonth} style={styles.monthNav} hitSlop={8}>
                <ChevronLeft size={22} color={Colors.textSecondary} />
              </Pressable>
              <Text style={styles.monthTitle}>
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </Text>
              <Pressable onPress={goNextMonth} style={styles.monthNav} hitSlop={8}>
                <ChevronRight size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekdayCell}>{w}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.calendarRow}>
                  {row.map((cell, colIndex) => {
                    if (cell.type === 'empty') {
                      return <View key={`e-${rowIndex}-${colIndex}`} style={styles.calendarDayCell} />;
                    }
                    const { day, date } = cell;
                    const selected = selectedDate !== null && isSameDay(date, selectedDate);
                    const disabled = isPast(date);
                    return (
                      <Pressable
                        key={date.getTime()}
                        onPress={() => handleSelectDay(date)}
                        disabled={disabled}
                        style={({ pressed }) => [
                          styles.calendarDayCell,
                          styles.calendarDayInner,
                          selected && styles.calendarDaySelected,
                          disabled && styles.calendarDayDisabled,
                          pressed && !disabled && styles.calendarDayPressed,
                        ]}>
                        <Text
                          style={[
                            styles.calendarDayText,
                            selected && styles.calendarDayTextSelected,
                            disabled && styles.calendarDayTextDisabled,
                          ]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {selectedDate && (
            <>
              <Text style={styles.slotTitle}>
                Available slots for {selectedDate.getMonth() + 1}/{selectedDate.getDate()}
              </Text>
              {slotsLoading ? (
                <View style={styles.slotsLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.slotsLoadingText}>Loading slots…</Text>
                </View>
              ) : slotsError ? (
                <Text style={styles.slotsError}>{slotsError}</Text>
              ) : availableSlots.length === 0 ? (
                <Text style={styles.slotsEmpty}>No slots available this day</Text>
              ) : (
                <View style={styles.slotGrid}>
                  {availableSlots.map((slot) => {
                    const picked = slot === selectedSlot;
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => setSelectedSlot(slot)}
                        style={({ pressed }) => [
                          styles.slotPill,
                          picked && styles.slotPillSelected,
                          pressed && styles.slotPillPressed,
                        ]}>
                        <Text
                          style={[
                            styles.slotText,
                            picked && styles.slotTextSelected,
                          ]}>
                          {slot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {selectedSlot && (
                <View style={styles.contactInputSection}>
                  <Text style={styles.contactInputLabel}>Contact number</Text>
                  <TextInput
                    style={styles.contactInput}
                    placeholder="Enter your phone number"
                    placeholderTextColor={Colors.textMuted}
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              <Pressable
                disabled={!selectedSlot || bookingInProgress || !contactNumber.trim()}
                onPress={handleRequestBooking}
                style={({ pressed }) => [
                  styles.requestButton,
                  (!selectedSlot || bookingInProgress || !contactNumber.trim()) && styles.requestButtonDisabled,
                  pressed && selectedSlot && !bookingInProgress && styles.requestButtonPressed,
                ]}>
                {bookingInProgress ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.requestButtonText}>
                    {selectedSlot ? 'Book this slot' : 'Select a slot to book'}
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {!selectedDate && (
            <Text style={styles.pickDateHint}>Select a date above to see available slots</Text>
          )}
        </Animated.View>
          </View>
        </PullToRefreshScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoid: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: { marginBottom: Spacing.lg },
  title: {
    ...Typography.display,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  myBookingsSection: {
    marginBottom: Spacing.xl,
  },
  myBookingsTitle: {
    ...Typography.titleSmall,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  myBookingsLoader: {
    marginVertical: Spacing.sm,
  },
  myBookingsEmpty: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  myBookingsList: {
    gap: Spacing.sm,
  },
  bookingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  bookingRoom: {
    ...Typography.titleSmall,
    color: Colors.text,
    marginBottom: 2,
  },
  bookingDetail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  bookingPrice: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  rewardCard: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  roomTabs: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  roomTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
  },
  roomTabSelected: {
    backgroundColor: Colors.primary,
  },
  roomTabPressed: {
    opacity: 0.85,
  },
  roomTabText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  roomTabTextSelected: {
    color: Colors.text,
    fontWeight: '700',
  },
  roomTabMeta: {
    ...Typography.caption,
    fontSize: 12,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  calendar: {
    marginBottom: Spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monthNav: {
    padding: Spacing.sm,
  },
  monthTitle: {
    ...Typography.titleSmall,
    color: Colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  calendarGrid: {
    marginHorizontal: -Spacing.xs,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  calendarDayCell: {
    flex: 1,
    height: 40,
    padding: 2,
  },
  calendarDayInner: {
    flex: 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  calendarDayDisabled: {
    opacity: 0.4,
  },
  calendarDayPressed: {
    opacity: 0.85,
  },
  calendarDayText: {
    ...Typography.caption,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: Colors.surface,
    fontWeight: '600',
  },
  calendarDayTextDisabled: {
    color: Colors.textMuted,
  },
  pickDateHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  slotsLoadingText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  slotsError: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginBottom: Spacing.lg,
  },
  slotsEmpty: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  slotTitle: {
    ...Typography.titleSmall,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  slotPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  slotPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotPillPressed: {
    opacity: 0.85,
  },
  slotText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  slotTextSelected: {
    color: Colors.text,
  },
  contactInputSection: {
    marginBottom: Spacing.lg,
  },
  contactInputLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  contactInput: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  requestButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  requestButtonDisabled: {
    backgroundColor: Colors.border,
  },
  requestButtonPressed: {
    opacity: 0.9,
  },
  requestButtonText: {
    ...Typography.button,
    color: Colors.surface,
  },
  priceLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
});
