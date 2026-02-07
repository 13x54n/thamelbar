import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/design';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OptionGroup = {
  label: string;
  modifier?: boolean;
  choices: { name: string; price?: number }[];
};

type MenuItemPayload = {
  id: string;
  name: string;
  description?: string;
  price?: string;
  optionGroups?: OptionGroup[];
};

export default function MenuItemDetailScreen() {
  const router = useRouter();
  const { id, itemJson } = useLocalSearchParams<{ id: string; itemJson?: string }>();

  const item = useMemo<MenuItemPayload | null>(() => {
    if (!itemJson) return null;
    try {
      return JSON.parse(itemJson) as MenuItemPayload;
    } catch {
      return null;
    }
  }, [itemJson]);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Menu item</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Item not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.name}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {item.price != null && item.price !== '' && (
            <Text
              style={[
                styles.price,
                !item.description && styles.priceOnly,
              ]}>
              {item.price}
            </Text>
          )}
          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}
        </View>

        {item.optionGroups && item.optionGroups.length > 0 ? (
          <View style={styles.optionGroups}>
            {item.optionGroups.map((group, gi) => (
              <View key={gi} style={styles.optionGroup}>
                <Text style={styles.optionGroupLabel}>{group.label}</Text>
                <View style={styles.choicesList}>
                  {group.choices.map((choice, ci) => (
                    <View
                      key={ci}
                      style={[
                        styles.choiceRow,
                        ci === group.choices.length - 1 && styles.choiceRowLast,
                      ]}>
                      <Text style={styles.choiceName}>{choice.name}</Text>
                      {choice.price != null ? (
                        <Text style={styles.choicePrice}>
                          {group.modifier
                            ? choice.price === 0
                              ? 'included'
                              : `+$${choice.price}`
                            : `$${choice.price}`}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
    marginRight: Spacing.sm,
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    flex: 1,
    ...Typography.title,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  price: {
    ...Typography.title,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  priceOnly: {
    marginBottom: 0,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  optionGroups: {
    marginTop: Spacing.sm,
  },
  optionGroup: {
    marginBottom: Spacing.xl,
  },
  optionGroupLabel: {
    ...Typography.caption,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  choicesList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.md,
  },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  choiceName: {
    ...Typography.body,
    color: Colors.text,
  },
  choicePrice: {
    ...Typography.bodySmall,
    color: Colors.primary,
  },
  choiceRowLast: {
    borderBottomWidth: 0,
  },
});
