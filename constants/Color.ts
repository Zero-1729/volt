/* Little helper that takes in the current theme and returns the appropriate color */
const Color = (currentTheme: String) => {
    let isDarkMode = currentTheme === 'dark';

    return {
        SVG: {
            Default: isDarkMode ? 'white' : 'black',
            GrayFill: isDarkMode ? '#676767' : '#B1B1B1',
        },
        Background: {
            Default: isDarkMode ? 'black' : 'white',
            AltDark: isDarkMode ? '#2c2c2c' : '#f0f0f0',
        },
        Text: {
            DarkText: isDarkMode ? 'white' : 'black',
            AltDarkText: isDarkMode ? 'black' : 'white',
            GrayedText: isDarkMode ? '#676767' : '#B1B1B1',
            GrayText: isDarkMode ? '#B8B8B8' : '#656565',
            LightGreyText: isDarkMode ? '#4b4b4b' : '#DADADA',
            DescText: isDarkMode ? '#828282' : '#606060',
        },
    };
};

export default Color;
