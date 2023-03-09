import React, {useContext} from 'react';
import {useColorScheme, View, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Scan from '../../assets/svg/scan.svg';
import Back from '../../assets/svg/arrow-left-24.svg';
import Box from '../../assets/svg/inbox-24.svg';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {Balance} from '../../components/balance';

const Wallet = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    // Get current wallet ID and wallet data
    const {currentWalletID, getWalletData} = useContext(AppStorageContext);

    // Get current wallet data
    const walletData = getWalletData(currentWalletID);

    // Get card color from wallet type
    const CardColor = ColorScheme.WalletColors[walletData.type];

    // TODO: Fetch transactions from wallet
    const transactions = [];

    const walletName = walletData.name;

    // Ideally get it from store
    const fiatRate = 23_000; // USD rate

    // Receive Wallet ID and fetch wallet data to display
    // Include functions to change individual wallet settings
    return (
        <SafeAreaView>
            <View style={[tailwind('w-full h-full')]}>
                {/* Top panel */}
                <View
                    style={[
                        tailwind('relative h-1/3 rounded-b-2xl'),
                        {backgroundColor: CardColor},
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute w-full top-4 flex-row justify-between',
                            ),
                        ]}>
                        <PlainButton
                            style={[tailwind('items-center flex-row left-6')]}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate('HomeScreen'),
                                );
                            }}>
                            <Back style={tailwind('mr-2')} fill={'white'} />
                            <Text
                                style={[tailwind('text-white w-1/2 font-bold')]}
                                numberOfLines={1}
                                ellipsizeMode={'middle'}>
                                {walletName}
                            </Text>
                        </PlainButton>
                        <PlainButton
                            style={[tailwind('right-6')]}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'WalletInfo',
                                    }),
                                );
                            }}>
                            <Dots width={32} fill={'white'} />
                        </PlainButton>
                    </View>

                    {/* Watch-only */}
                    {walletData.isWatchOnly ? (
                        <View style={[tailwind('absolute top-12 right-6')]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-sm ml-2 p-1 self-center text-black font-bold bg-white rounded-sm opacity-40',
                                    ),
                                ]}>
                                Watch-only
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}

                    {/* Balance */}
                    <View
                        style={[
                            tailwind('absolute self-center w-5/6 bottom-28'),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm text-white opacity-60 mb-1'),
                            ]}>
                            Balance
                        </Text>

                        {/* Balance component */}
                        <Balance
                            id={currentWalletID}
                            BalanceFontSize={'text-4xl'}
                            fiatRate={fiatRate}
                        />
                    </View>

                    {/* Send and receive */}
                    <View
                        style={[
                            tailwind(
                                'absolute bottom-4 w-full justify-evenly flex-row mt-4 mb-4',
                            ),
                        ]}>
                        <View
                            style={[
                                tailwind('rounded p-4 w-32'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Primary,
                                },
                            ]}>
                            <PlainButton>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-sm text-center font-bold',
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Send
                                </Text>
                            </PlainButton>
                        </View>
                        <View
                            style={[
                                tailwind('rounded p-4 w-32'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Primary,
                                },
                            ]}>
                            <PlainButton>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-sm text-center font-bold',
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Receive
                                </Text>
                            </PlainButton>
                        </View>
                        <View
                            style={[
                                tailwind('justify-center rounded px-4'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Primary,
                                },
                            ]}>
                            <PlainButton
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.navigate({
                                            name: 'Scan',
                                            params: {
                                                walletID: currentWalletID,
                                                key: 'Wallet',
                                            },
                                        }),
                                    );
                                }}>
                                <Scan
                                    width={32}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>
                        </View>
                    </View>

                    {/* Bottom line divider */}
                    <View
                        style={[
                            tailwind(
                                'w-16 h-1 absolute bottom-2 rounded-full mt-2 self-center',
                            ),
                            {backgroundColor: ColorScheme.Background.Primary},
                        ]}
                    />
                </View>

                {/* Transactions List */}
                <View style={[tailwind('h-2/3 w-full')]}>
                    <View style={[tailwind('ml-6 mt-6')]}>
                        <Text
                            style={[
                                tailwind('text-lg font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Transactions
                        </Text>
                    </View>

                    {transactions.length === 0 ? (
                        <View
                            style={[
                                tailwind(
                                    'flex mt-6 justify-around text-justify h-5/6 items-center justify-center',
                                ),
                            ]}>
                            <Box
                                width={32}
                                fill={ColorScheme.SVG.GrayFill}
                                style={tailwind('mb-4 -mt-6')}
                            />
                            <Text
                                style={[
                                    tailwind('w-3/5 text-center'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                A list of all transactions for this wallet be
                                displayed here
                            </Text>
                        </View>
                    ) : (
                        <View />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Wallet;
