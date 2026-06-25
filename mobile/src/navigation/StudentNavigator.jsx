import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FloatingTabBar from '../components/ui/FloatingTabBar';

import OffersScreen       from '../screens/student/OffersScreen';
import OfferDetailScreen  from '../screens/student/OfferDetailScreen';
import FavorisScreen      from '../screens/student/FavorisScreen';
import MyInternshipScreen from '../screens/student/MyInternshipScreen';
import AbsencesScreen     from '../screens/student/AbsencesScreen';
import EvaluationsScreen  from '../screens/student/EvaluationsScreen';
import CandidaturesScreen from '../screens/student/CandidaturesScreen';
import ProfileScreen        from '../screens/student/ProfileScreen';
import ProfileEditScreen    from '../screens/student/ProfileEditScreen';
import ChangePasswordScreen from '../screens/student/ChangePasswordScreen';
import NotificationsScreen  from '../screens/student/NotificationsScreen';

const Tab       = createBottomTabNavigator();
const Stack     = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function AccueilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Offers"      component={OffersScreen}      />
      <Stack.Screen name="OfferDetail" component={OfferDetailScreen} />
      <Stack.Screen name="Favoris"     component={FavorisScreen}     />
    </Stack.Navigator>
  );
}

function StageStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyInternship"  component={MyInternshipScreen} />
      <Stack.Screen name="Absences"      component={AbsencesScreen}     />
      <Stack.Screen name="Evaluations"   component={EvaluationsScreen}  />
    </Stack.Navigator>
  );
}

function CandidaturesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Candidatures" component={CandidaturesScreen} />
      <Stack.Screen name="OfferDetail"  component={OfferDetailScreen}  />
    </Stack.Navigator>
  );
}

function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"        component={ProfileScreen}        />
      <Stack.Screen name="ProfileEdit"    component={ProfileEditScreen}    />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Favoris"        component={FavorisScreen}        />
      <Stack.Screen name="OfferDetail"    component={OfferDetailScreen}    />
      <Stack.Screen name="Evaluations"    component={EvaluationsScreen}    />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="AccueilTab"      component={AccueilStack}      />
      <Tab.Screen name="StageTab"        component={StageStack}        />
      <Tab.Screen name="CandidaturesTab" component={CandidaturesStack} />
      <Tab.Screen name="ProfilTab"       component={ProfilStack}       />
    </Tab.Navigator>
  );
}

export default function StudentNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs"          component={TabNavigator}       />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />
    </RootStack.Navigator>
  );
}
