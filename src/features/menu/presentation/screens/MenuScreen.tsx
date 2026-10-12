import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ListItem } from '../../../../shared/presentation/components/ListItem';
import { QueryState } from '../../../../shared/presentation/components/QueryState';
import { formatPrice } from '../../../../shared/presentation/format';
import { DishBadges } from '../components/DishBadges';
import type { MenuStackParamList } from '../navigation/MenuStack';
import { useMenu } from '../viewmodels/useMenu';

type Props = NativeStackScreenProps<MenuStackParamList, 'MenuList'>;

export function MenuScreen({ navigation }: Props) {
  const { dishes, isLoading, isRefreshing, error, refresh } = useMenu();

  if (isLoading || (error && dishes.length === 0)) {
    return <QueryState isLoading={isLoading} error={error} onRetry={refresh} loadingLabel="Cargando menú" />;
  }

  return (
    <FlatList
      data={dishes}
      keyExtractor={(dish) => dish.id}
      contentContainerStyle={styles.list}
      refreshing={isRefreshing}
      onRefresh={refresh}
      ListEmptyComponent={<Text style={styles.empty}>No hay platillos en el menú.</Text>}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <ListItem
          title={item.name}
          subtitle={item.shortDescription}
          trailing={formatPrice(item.price)}
          imageUrl={item.imageUrl}
          dimmed={!item.available}
          badges={<DishBadges dish={item} />}
          accessibilityLabel={`${item.name}, ${formatPrice(item.price)}${item.available ? '' : ', agotado'}`}
          onPress={() => navigation.navigate('DishDetail', { id: item.id, name: item.name })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  separator: { height: 8 },
  empty: { textAlign: 'center', color: '#777', marginTop: 32 },
});
