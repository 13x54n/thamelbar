import PullToRefreshScrollView from '@/components/pull-to-refresh-scroll-view';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/design';
import { contentApi, type MenuItem, type MenuCategory } from '@/lib/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

/** Order and labels match frontend MENU.sections (frontend/app/page.tsx) */
function groupByCategory(
  items: MenuItem[],
  categories: MenuCategory[]
): { categoryId: string; categoryTitle: string; items: MenuItem[] }[] {
  const order = categories.map((c) => c.id);
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    const cat = item.category || 'starters';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  const result: { categoryId: string; categoryTitle: string; items: MenuItem[] }[] = [];
  for (const id of order) {
    const categoryItems = map.get(id);
    if (categoryItems?.length) {
      const cat = categories.find((c) => c.id === id);
      result.push({
        categoryId: id,
        categoryTitle: cat?.title ?? id,
        items: categoryItems,
      });
    }
  }
  // Any items with unknown category at the end
  for (const [id, categoryItems] of map) {
    if (!order.includes(id)) {
      const cat = categories.find((c) => c.id === id);
      result.push({
        categoryId: id,
        categoryTitle: cat?.title ?? id,
        items: categoryItems,
      });
    }
  }
  return result;
}

export default function MenuScreen() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        contentApi.getMenu(),
        contentApi.getMenuCategories(),
      ]);
      setMenu(menuRes.menu);
      setCategories(catRes.categories);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load menu');
      setMenu([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const groups = groupByCategory(menu, categories);
  const router = useRouter();

  const openItem = useCallback(
    (item: MenuItem) => {
      router.push({
        pathname: '/menu-item/[id]',
        params: { id: item.id, itemJson: JSON.stringify(item) },
      });
    },
    [router]
  );

  if (loading && menu.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Food & drinks</Text>
          <Text style={styles.subtitle}>Our menu</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Food & drinks</Text>
        <Text style={styles.subtitle}>Our menu</Text>
      </View>
      <PullToRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {groups.length === 0 && !error && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No menu items yet.</Text>
          </View>
        )}
        {groups.map(({ categoryId, categoryTitle, items }) => (
          <View key={categoryId} style={styles.section}>
            <Text style={styles.categoryTitle}>{categoryTitle}</Text>
            {items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => openItem(item)}>
                <View style={styles.cardBody}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  {item.price ? (
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  ) : null}
                </View>
                <ChevronRight size={20} color={Colors.textMuted} style={styles.chevron} />
              </Pressable>
            ))}
          </View>
        ))}
      </PullToRefreshScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    color: Colors.primary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  empty: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    ...Typography.titleSmall,
    color: Colors.text,
    marginBottom: Spacing.md,
    textTransform: 'capitalize',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: Spacing.sm,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
  itemName: {
    ...Typography.titleSmall,
    color: Colors.text,
  },
  itemDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  itemPrice: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
});
