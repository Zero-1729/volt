export const addCommas = (num: string, separator: string = ',') => {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};
