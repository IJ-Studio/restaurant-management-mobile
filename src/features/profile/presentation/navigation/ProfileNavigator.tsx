import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { ProfileScreen } from '../../../auth/presentation/screens/ProfileScreen';
import { DeleteAccountScreen } from '../../../privacy/presentation/screens/DeleteAccountScreen';
import { PrivacyScreen } from '../../../privacy/presentation/screens/PrivacyScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Privacy: undefined;
  DeleteAccount: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileHome() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  return (
    <ProfileScreen
      onEditProfile={() => navigation.navigate('EditProfile')}
      onChangePassword={() => navigation.navigate('ChangePassword')}
      onPrivacy={() => navigation.navigate('Privacy')}
    />
  );
}

function Privacy() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  return <PrivacyScreen onDeleteAccount={() => navigation.navigate('DeleteAccount')} />;
}

/** Perfil → editar datos / cambiar contraseña / privacidad → eliminar cuenta. */
export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileHome} options={{ title: 'Perfil' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Cambiar contraseña' }}
      />
      <Stack.Screen name="Privacy" component={Privacy} options={{ title: 'Privacidad' }} />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{ title: 'Eliminar mi cuenta' }}
      />
    </Stack.Navigator>
  );
}
