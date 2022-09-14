// Based on https://levelup.gitconnected.com/debounce-in-javascript-improve-your-applications-performance-5b01855e086
const debounce = (func: Function, ms: number) => {
    let timeout: ReturnType<typeof setTimeout>;

    return function executedFunction(...args: any[]) {
        const later = () => {
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, ms);
    };
};

export default debounce;
