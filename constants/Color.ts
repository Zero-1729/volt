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
        SVG: {
            Default: isDarkMode ? 'white' : 'black',
            GrayFill: isDarkMode ? '#676767' : '#B1B1B1',
            Inverted: isDarkMode ? 'black' : 'white',
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
        },
        MiscCardColor: {
            ImportAltCard: isDarkMode ? '#2c2c2c' : 'white',
        },
        // Get index using WalletType
        WalletColors: {
            bech32: '#5c0931', // Burgundy
            Legacy: '#1E90FF', // Dodgerblue
            Segwit: '#008000', // Green
            Taproot: '#800080', // Purple
        },
    };

    return colors;
};

type ColorThemeType = string | unknown;

export default Color;
