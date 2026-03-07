export const COLORS = {
    white: '#ffffff',
    blue: '#0096de',
    blueDark: '#384050',
    black: '#000000',
    grey: '#999999',
} as const;

export const CSS_VARS = {
    white: '--aura-white',
    blue: '--aura-blue',
    blueDark: '--aura-blue-dark',
    black: '--aura-black',
    grey: '--aura-grey',
} as const;

export const injectColors = () => {
    const root = document.documentElement;
    (Object.keys(COLORS) as Array<keyof typeof COLORS>).forEach((key) => {
        root.style.setProperty(CSS_VARS[key], COLORS[key]);
    });
};
