/* Little helper that takes in the current theme and returns the appropriate color */
const Color = (currentTheme: ColorThemeType) => {
    let isDarkMode = currentTheme === 'dark';

    const colors: {[index: string]: any} = {
        isDarkMode: isDarkMode,
        NavigatorTheme: {
            colors: {
                background: isDarkMode ? 'black' : 'white',
            },
        },
        BarStyle: {
            Inverted: isDarkMode ? 'light-content' : 'dark-content',
            Default: isDarkMode ? 'dark-content' : 'light-content',
        },
        SVG: {
            Default: isDarkMode ? 'white' : 'black',
            GrayFill: isDarkMode ? '#676767' : '#B1B1B1',
            Inverted: isDarkMode ? 'black' : 'white',
            Sent: isDarkMode ? '#ff6767' : '#a20000',
            Received: isDarkMode ? '#76ff76' : '#00b100',
        },
        Background: {
            Primary: isDarkMode ? 'black' : 'white',
            Secondary: isDarkMode ? '#2c2c2c' : '#f0f0f0',
            Inverted: isDarkMode ? 'white' : 'black',
            CheckBoxFilled: isDarkMode ? 'black' : 'black',
            CheckBoxOutline: isDarkMode ? 'white' : 'black',
            CheckBoxUnfilled: isDarkMode ? 'black' : 'white',
            Greyed: isDarkMode ? '#202020' : '#E5E5E5',
            CardGreyed: isDarkMode ? '#3f3f3f' : '#D5D5D5',
            Alert: '#ff4545',
            QRBorder: isDarkMode ? 'white' : '#E5E5E5',
            Correct: isDarkMode ? '#34C571' : '#34C571',
            Wrong: isDarkMode ? '#EB5757' : '#EB5757',
            Fade0: isDarkMode ? 'transparent' : '#FFFFFF00',
            Fade1: isDarkMode ? 'black' : 'white',
        },
        HeadingBar: isDarkMode ? '#1b1b1b' : '#F3F3F3',
        Text: {
            Default: isDarkMode ? 'white' : 'black',
            Alt: isDarkMode ? 'black' : 'white',
            AltGray: isDarkMode ? '#7c7c7c' : '#A8A8A8',
            GrayedText: isDarkMode ? '#676767' : '#B1B1B1',
            GrayText: isDarkMode ? '#B8B8B8' : '#656565',
            LightGreyText: isDarkMode ? '#4b4b4b' : '#DADADA',
            DescText: isDarkMode ? '#828282' : '#606060',
            Alert: 'white',
        },
        MiscCardColor: {
            ImportAltCard: isDarkMode ? '#2c2c2c' : 'white',
            ImportCardButton: isDarkMode ? '#3f3f3f' : '#efefef',
            ImportCard: isDarkMode ? '#1f1f1f' : '#ffffff',
        },
        // Get index using WalletType
        WalletColors: {
            wpkh: {bitcoin: '#800080', testnet: '#590059', accent: '#4c004c'}, // Burgundy
            p2pkh: {bitcoin: 'darkgrey', testnet: 'grey', accent: '#656565'}, // Grey
            shp2wpkh: {
                bitcoin: '#008000',
                testnet: '#408000',
                accent: '#004c00',
            }, // Green
            p2tr: {bitcoin: '#004b94', testnet: '#1E90FF', accent: '#002d58'}, // Blue
            unified: {
                bitcoin: '#0069FF',
                testnet: '#2981FF',
                accent: '#0044A5',
            }, // OFF2024
        },
    };

    return colors;
};

type ColorThemeType = string | unknown;

export default Color;
