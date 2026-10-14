import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RefreshControl, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { ListItem } from '../../../../shared/presentation/components/ListItem';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { dishSubtitle } from '../components/dishLabels';
import type { MenuStackParamList } from '../navigation/MenuNavigator';
import { useMenu } from '../viewmodels/useMenu';

export function MenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MenuStackParamList>>();
  const { sections, search, setSearch, isLoading, isRefreshing, errorMessage, hasData, refresh } = useMenu();

  if (isLoading) return <ScreenState kind="loading" message="Cargando menú…" />;
  if (errorMessage && !hasData) return <ScreenState kind="error" message={errorMessage} onRetry={refresh} />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar platillo"
        accessibilityLabel="Buscar platillo"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <SectionList
        sections={sections.map((category) => ({
          key: String(category.id),
          title: category.name,
          data: category.dishes,
        }))}
        keyExtractor={(dish) => String(dish.id)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.header} accessibilityRole="header">
            {section.title}
          </Text>
        )}
        renderItem={({ item: dish }) => (
          <ListItem
            title={dish.name}
            subtitle={dishSubtitle(dish)}
            trailing={formatCurrency(dish.price)}
            imageUrl={dish.imageUrl}
            badge={dish.available ? undefined : 'Agotado'}
            disabled={!dish.available}
            onPress={() => navigation.navigate('DishDetail', { dishId: dish.id, name: dish.name })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <ScreenState
            kind="empty"
            message={search ? `Sin resultados para "${search}".` : 'El menú está vacío.'}
          />
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  search: {
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 84 },
});
