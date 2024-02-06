import React, {ReactElement} from 'react';

import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Intro from '../../screens/onboarding/Intro';
import DescriptorsInfo from '../../screens/onboarding/DescriptorsInfo';
import SelectMode from '../../screens/onboarding/SelectMode';

import {NavigationContainer} from '@react-navigation/native';
import {AddWalletRoot} from '../../Navigation';

export type OnboardingStackParamList = {
    Intro: undefined;
    DescriptorsInfo: undefined;
    SelectMode: undefined;
    AddWalletRoot: undefined;
};

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const OnboardingNavigator = (): ReactElement => {
    return (
        <NavigationContainer>
            <OnboardingStack.Navigator screenOptions={{headerShown: false}}>
                <OnboardingStack.Screen name="Intro" component={Intro} />
                <OnboardingStack.Screen
                    name="DescriptorsInfo"
                    component={DescriptorsInfo}
                />
                <OnboardingStack.Screen
                    name="SelectMode"
                    component={SelectMode}
                />
                <OnboardingStack.Screen
                    name="AddWalletRoot"
                    component={AddWalletRoot}
                    options={{headerShown: false, presentation: 'modal'}}
                />
            </OnboardingStack.Navigator>
        </NavigationContainer>
    );
};

export default OnboardingNavigator;
