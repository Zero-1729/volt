import React, {ReactElement} from 'react';

import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Intro from '../../screens/onboarding/Intro';
import DescriptorsInfo from '../../screens/onboarding/DescriptorsInfo';
import MoreInfo from '../../screens/onboarding/MoreInfo';

import SetPIN from '../../screens/settings/pin/SetPIN';
import WelcomePIN from '../../screens/settings/pin/Welcome';
import ConfirmPIN from '../../screens/settings/pin/ConfirmPIN';
import DonePIN from '../../screens/settings/pin/Done';
import SetBiometrics from '../../screens/settings/pin/SetBiometrics';

import {NavigationContainer} from '@react-navigation/native';
import {AddWalletRoot} from '../../Navigation';

export type OnboardingStackParamList = {
    Intro: undefined;
    DescriptorsInfo: undefined;
    MoreInfo: undefined;
    AddWalletRoot: undefined;
    WelcomePIN: undefined;
    SetPIN: {
        isChangePIN?: boolean;
        isPINReset?: boolean;
    };
    ConfirmPIN: {
        pin: string;
        isChangePIN?: boolean;
        isPINReset?: boolean;
    };
    DonePIN: {
        isChangePIN?: boolean;
        isPINReset?: boolean;
    };
    SetBiometrics: {
        standalone: boolean;
    };
    ResetPIN: {
        isPINReset: boolean;
        isChangePIN?: boolean;
    };
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
                <OnboardingStack.Screen name="MoreInfo" component={MoreInfo} />
                <OnboardingStack.Screen
                    name="AddWalletRoot"
                    component={AddWalletRoot}
                    options={{headerShown: false, presentation: 'modal'}}
                />
                <OnboardingStack.Screen
                    name="WelcomePIN"
                    component={WelcomePIN}
                />
                <OnboardingStack.Screen name="SetPIN" component={SetPIN} />
                <OnboardingStack.Screen
                    name="ConfirmPIN"
                    component={ConfirmPIN}
                />
                <OnboardingStack.Screen name="DonePIN" component={DonePIN} />
                <OnboardingStack.Screen
                    name="SetBiometrics"
                    component={SetBiometrics}
                />
            </OnboardingStack.Navigator>
        </NavigationContainer>
    );
};

export default OnboardingNavigator;
