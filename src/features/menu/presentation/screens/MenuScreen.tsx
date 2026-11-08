import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RefreshControl, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { ListItem } from '../../../../shared/presentation/components/ListItem';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { colors, radius, sizes, spacing, typography } from '../../../../shared/presentation/theme';
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
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar platillo"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.brand}
          accessibilityLabel="Buscar platillo"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>
      {errorMessage && <Notice message={`No se pudo actualizar: ${errorMessage}`} style={styles.notice} />}
      <SectionList
        sections={sections.map((category) => ({
          key: String(category.id),
          title: category.name,
          data: category.dishes,
        }))}
        keyExtractor={(dish) => String(dish.id)}
        renderSectionHeader={({ section }) => (
          <View style={styles.header}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              {section.title}
            </Text>
            <Text style={styles.headerCount}>
              {section.data.length} {section.data.length === 1 ? 'platillo' : 'platillos'}
            </Text>
          </View>
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.brand}
            onRefresh={async () => {
              await refresh();
            }}
          />
        }
        stickySectionHeadersEnabled
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: sizes.touchTarget + spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  search: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  notice: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerTitle: { ...typography.overline, color: colors.brandStrong },
  headerCount: { ...typography.caption, color: colors.textSecondary },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + sizes.thumbnail + spacing.md,
  },
});
