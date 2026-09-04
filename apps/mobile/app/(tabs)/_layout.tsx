import { Tabs } from 'expo-router';
import { AirplaneTilt, GearSix, User } from 'phosphor-react-native';
import { FloatingTabBar, useTheme, type FloatingTabItem } from '@/ui';

/**
 * Onglets de l'agent : trois pastilles flottantes, centrées.
 *
 * Pas d'onglet large : l'agent ne cherche rien, il choisit un vol et scanne.
 * L'icône passe en `fill` quand l'onglet est actif ; c'est le poids du trait
 * qui porte l'état, pas une couleur.
 */
const TABS: { name: string; label: string; icon: FloatingTabItem['icon'] }[] = [
  {
    name: 'flights',
    label: 'Vols',
    icon: ({ color, focused, size }) => (
      <AirplaneTilt size={size} color={color} weight={focused ? 'fill' : 'regular'} />
    ),
  },
  {
    name: 'profile',
    label: 'Profil',
    icon: ({ color, focused, size }) => (
      <User size={size} color={color} weight={focused ? 'fill' : 'regular'} />
    ),
  },
  {
    name: 'settings',
    label: 'Paramètres',
    icon: ({ color, focused, size }) => (
      <GearSix size={size} color={color} weight={focused ? 'fill' : 'regular'} />
    ),
  },
];

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
      tabBar={({ state, navigation }) => (
        <FloatingTabBar
          items={TABS.map((tab): FloatingTabItem => {
            const index = state.routes.findIndex((route) => route.name === tab.name);

            return {
              key: tab.name,
              label: tab.label,
              icon: tab.icon,
              focused: state.index === index,
              onPress: () => navigation.navigate(tab.name),
            };
          })}
        />
      )}
    >
      <Tabs.Screen name="flights" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
