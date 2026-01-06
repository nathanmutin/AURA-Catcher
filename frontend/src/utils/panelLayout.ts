import { wrapText } from './textUtils';
import panelColors from '../colors.css?inline';

// Path Data Constants (copied from original source/SVG)
const PATH_DISK = "M93.79 61.72a33.18 33.18 0 11-33.18-33.18 33.18 33.18 0 0133.18 33.18";
const PATH_ALPES = "M65.73 42.52h-3.17l-7.49 12.86 3.17 1.84 5.9-10.14 12 20.59 3.17-1.84-13.58-23.31zM47.78 71.44h33.46v3.66H47.78z";
const PATH_AUVERGNE = "M65.23 58.12a10.28 10.28 0 01-15.35.43h-3.26l-.14.23L38 73.25l3.16 1.85 6.14-10.51 1.31-2.24a13.92 13.92 0 0019.32-1.78z";

const PATH_LA_REGION = "M109.77 28.6h8.06v29.27h14.49v6.32h-22.55V28.6zM136.32 57c0-6.08 5.57-8.37 13.54-8.37h2.93v-1c0-3.09-.94-4.78-4.23-4.78-2.84 0-4.13 1.44-4.43 3.68h-6.82c.45-6.17 5.33-8.91 11.7-8.91s10.9 2.59 10.9 9.66v17h-7v-3.22c-1.49 2.09-3.78 3.68-7.86 3.68-4.73 0-8.71-2.29-8.71-7.76m16.47-1.89V52.9H150c-4.19 0-6.62.89-6.62 3.68 0 1.89 1.14 3.13 3.78 3.13 3.18 0 5.62-1.74 5.62-4.62M176.88 28.6h12.75c8.41 0 13.74 3.44 13.74 10.81v.19c0 5.38-3.14 8.22-7.32 9.46l9.41 15.14h-8.57l-8.51-13.74h-3.48V64.2h-8zM189.43 45c4 0 6.07-1.69 6.07-5.13v-.2c0-3.63-2.19-4.87-6.07-4.87h-4.53V45zM207.94 51.5v-.4c0-8.21 5.83-13.54 13.39-13.54 6.72 0 12.69 3.94 12.69 13.25v2h-18.76c.2 4.34 2.54 6.82 6.47 6.82 3.33 0 5-1.44 5.42-3.63H234c-.84 5.63-5.32 8.76-12.44 8.76-7.86 0-13.59-4.93-13.59-13.24M227 48.37c-.24-3.94-2.23-5.83-5.67-5.83-3.24 0-5.42 2.14-6 5.83zm-5.87-21.66h7.57l-5.18 7.92h-5.23zM238.39 64.74h7.17c.44 2.29 2.09 3.78 5.77 3.78 4.38 0 6.57-2.28 6.57-6.37v-3.93a9.76 9.76 0 01-8.36 4.83c-6.32 0-11.35-4.73-11.35-12.44v-.35c0-7.47 5-12.7 11.45-12.7 4.23 0 6.77 1.85 8.26 4.48v-3.88h7.17v24c-.05 7.72-5.18 11.65-13.74 11.65s-12.24-3.68-12.94-9.06m19.71-14.24v-.35c0-4.43-2.34-7.12-6.27-7.12s-6.27 2.89-6.27 7.17v.4c0 4.33 2.54 7 6.12 7 3.78 0 6.42-2.68 6.42-7.11M271.61 30.7a4.11 4.11 0 114.08 3.93 3.95 3.95 0 01-4.08-3.93m.55 7.46h7.16v26h-7.16zM284.79 51.45v-.4c0-8.16 5.92-13.49 13.74-13.49s13.69 5.23 13.69 13.34v.4c0 8.22-5.93 13.44-13.74 13.44s-13.69-5.17-13.69-13.29m20.11-.1V51c0-5-2.34-8-6.37-8s-6.37 2.89-6.37 7.86v.4c0 5 2.29 8 6.37 8s6.37-3 6.37-7.92M317.7 38.16h7.22v4.13c1.29-2.59 4.13-4.72 8.46-4.72 5.13 0 8.76 3.08 8.76 10v16.62h-7.21V48.66c0-3.53-1.4-5.22-4.58-5.22s-5.43 1.89-5.43 5.72v15h-7.22zM115.24 78.63h2.6l5.52 16.29h-2l-1.6-4.69h-6.72l-1.57 4.69h-1.87zm-1.61 10h5.65l-2.83-8.38zM124.8 90.55V83h1.9v7.46c0 2.09.89 3 2.75 3a3.14 3.14 0 003.29-3.26V83h1.89v11.92h-1.89V93a4.07 4.07 0 01-3.79 2.1c-2.37 0-4.15-1.3-4.15-4.58M136.4 83h2.05l3.53 10.01L145.47 83h1.96l-4.29 11.92h-2.41L136.4 83zM148 89.09v-.18c0-3.61 2.31-6.11 5.59-6.11 2.76 0 5.35 1.66 5.35 5.92v.62h-9c.09 2.71 1.39 4.22 3.82 4.22 1.85 0 2.92-.69 3.17-2.08h1.89c-.41 2.39-2.39 3.65-5.08 3.65-3.37 0-5.77-2.37-5.77-6m9-1.28c-.18-2.46-1.46-3.44-3.42-3.44s-3.24 1.32-3.56 3.44zM161.26 83h1.89v2.14a4.17 4.17 0 013.92-2.34v1.78c-2.39.11-3.92.86-3.92 3.8v6.54h-1.89zM168.14 95.61h1.94c.27 1.36 1.41 2.07 3.44 2.07 2.35 0 3.83-1.12 3.83-3.67v-1.73a4.93 4.93 0 01-4 2.25 5.37 5.37 0 01-5.42-5.65v-.16a5.64 5.64 0 015.56-5.92 4.26 4.26 0 013.9 2.12V83h1.89v11.12c0 3.47-2.37 5.16-5.7 5.16-3.53 0-5.08-1.67-5.4-3.67m9.28-6.86v-.16c0-2.67-1.46-4.22-3.79-4.22s-3.78 1.75-3.78 4.26v.18c0 2.6 1.66 4.15 3.67 4.15 2.21 0 3.9-1.55 3.9-4.21M182.28 83h1.89v1.89A4.11 4.11 0 01188 82.8c2.46 0 4.19 1.34 4.19 4.81v7.31h-1.89v-7.45c0-2.1-.89-3-2.8-3a3.13 3.13 0 00-3.33 3.26v7.22h-1.89zM194.42 89.09v-.18c0-3.61 2.3-6.11 5.58-6.11 2.76 0 5.36 1.66 5.36 5.92v.62h-9c.09 2.71 1.39 4.22 3.83 4.22 1.84 0 2.91-.69 3.16-2.08h1.89c-.41 2.39-2.39 3.65-5.08 3.65-3.37 0-5.76-2.37-5.76-6m9-1.28c-.18-2.46-1.46-3.44-3.42-3.44s-3.24 1.32-3.55 3.44zM207.63 87.77h4.88v1.78h-4.88zM215.75 78.63h4.9c3.12 0 5.7 1.27 5.7 4.53v.09c0 2.69-1.8 4-4 4.45l5 7.22h-2.21l-4.85-7.09h-2.51v7.09h-2zm5 7.63c2.32 0 3.57-1 3.57-3v-.09c0-2.21-1.36-2.94-3.57-2.94h-3.06v6zM229.24 77.3h1.89v7.59A4.11 4.11 0 01235 82.8c2.46 0 4.19 1.34 4.19 4.81v7.31h-1.89v-7.45c0-2.1-.89-3-2.8-3a3.14 3.14 0 00-3.33 3.26v7.22h-1.89zM241.34 89.06v-.18a5.86 5.86 0 1111.71 0V89a5.86 5.86 0 11-11.71 0m9.75 0v-.15c0-2.76-1.53-4.54-3.9-4.54s-3.89 1.78-3.89 4.51V89c0 2.72 1.48 4.5 3.89 4.5s3.9-1.81 3.9-4.5m-4.74-11.39h1.71L250.5 81h-1.39l-1.94-1.71-1.94 1.71h-1.34zM255.37 83h1.89v1.89a4.11 4.11 0 013.83-2.09c2.46 0 4.19 1.34 4.19 4.81v7.31h-1.89v-7.45c0-2.1-.89-3-2.8-3a3.13 3.13 0 00-3.33 3.26v7.22h-1.89zM267.51 89.09v-.18c0-3.61 2.3-6.11 5.58-6.11 2.76 0 5.36 1.66 5.36 5.92v.62h-9c.09 2.71 1.39 4.22 3.82 4.22 1.85 0 2.92-.69 3.17-2.08h1.89c-.41 2.39-2.39 3.65-5.08 3.65-3.37 0-5.76-2.37-5.76-6m9-1.28c-.18-2.46-1.46-3.44-3.42-3.44s-3.24 1.32-3.56 3.44zM280.72 87.77h4.88v1.78h-4.88zM292.69 78.63h2.59l5.52 16.29h-2l-1.6-4.69h-6.72L289 94.92h-1.87zm-1.62 10h5.65l-2.83-8.38zM302.81 77.3h1.91v17.62h-1.91zM307.75 83h1.9v2a4.9 4.9 0 014-2.21c3.12 0 5.43 2.28 5.43 6V89c0 3.65-2.15 6.16-5.43 6.16a4.5 4.5 0 01-4-2.17v6.11h-1.9zm9.39 6.06v-.18c0-3-1.66-4.51-3.66-4.51-2.22 0-3.9 1.46-3.9 4.51v.18c0 3.06 1.59 4.5 3.92 4.5s3.64-1.6 3.64-4.5M320.69 89.09v-.18c0-3.61 2.3-6.11 5.59-6.11 2.75 0 5.35 1.66 5.35 5.92v.62h-9c.09 2.71 1.39 4.22 3.83 4.22 1.85 0 2.92-.69 3.17-2.08h1.89c-.41 2.39-2.39 3.65-5.08 3.65-3.37 0-5.77-2.37-5.77-6m9-1.28c-.19-2.46-1.46-3.44-3.42-3.44s-3.24 1.32-3.56 3.44zM333.1 91.25h1.84c.14 1.42.89 2.3 2.81 2.3s2.59-.61 2.59-1.89-.93-1.66-2.78-2c-3.1-.57-4.15-1.44-4.15-3.51s2.17-3.35 4-3.35c2.14 0 4 .86 4.31 3.44h-1.83c-.27-1.3-1-1.87-2.5-1.87s-2.26.68-2.26 1.71.59 1.5 2.78 1.89c2.46.46 4.19 1 4.19 3.53 0 2.17-1.48 3.63-4.37 3.63s-4.56-1.44-4.67-3.88";

export const COLORS = {
    white: 'var(--aura-white)',
    blue: 'var(--aura-blue)',
    black: 'var(--aura-black)',
    grey: 'var(--aura-grey)'
};

export interface PanelLayout {
    width: number;
    height: number;
    viewBox: string;
    colors: typeof COLORS;
    blueRect: {
        d: string;
        fill: string;
    };
    logo: {
        transform: string;
        paths: { d: string; fill: string; }[];
    };
    regionText: {
        transform: string;
        d: string;
        fill: string;
    };
    whiteRect: {
        d: string;
        fill: string;
    };
    customText: {
        lines: { text: string; x: number; y: number; }[];
        fontSize: number;
        fill: string;
    };
    border: {
        x: number;
        y: number;
        width: number;
        height: number;
        rx: number;
        ry: number;
        stroke: string;
        strokeWidth: number;
    };
    styleTag: string;
}

export function calculatePanelLayout(text: string, scale: number = 200): PanelLayout {
    const heightUp = scale;
    const heightDown = 0.32 * scale;
    const r = 0.1 * scale; // corner radius
    const e = 0.02 * scale; // border thickness
    const heightLogo = 0.3 * scale;
    const widthLaRegion = 0.71 * scale;

    // --- LOGO CALCULATION ---
    // logo(height, x, y)
    // height = heightLogo
    // x = (heightUp - heightLogo) / 2
    // y = 0.16 * scale
    const logoBaseY = 0.16 * scale;
    const logoBaseX = (heightUp - heightLogo) / 2;

    const logoScale = 1.505 * heightLogo / 100;
    const logoDx = -27.4 + logoBaseX / logoScale;
    const logoDy = -28 + logoBaseY / logoScale;
    const logoTransform = `scale(${logoScale}) translate(${logoDx}, ${logoDy})`;

    // --- LA REGION TEX CALCULATION ---
    // laRegion(width, x, y)
    // width = widthLaRegion
    // x = (heightUp - widthLaRegion) / 2
    // y = 0.6 * scale
    const regionBaseY = 0.6 * scale;
    const regionBaseX = (heightUp - widthLaRegion) / 2;

    const regionScale = 0.43 * widthLaRegion / 100;
    const regionDx = -109.5 + regionBaseX / regionScale;
    const regionDy = -26.3 + regionBaseY / regionScale;
    const regionTransform = `scale(${regionScale}) translate(${regionDx}, ${regionDy})`;

    // --- CUSTOM TEXT CALCULATION ---
    const { fontSize, lines } = wrapText(text); // fontSize is relative 0-0.09

    const lineHeight = fontSize * scale * 1.2;
    const totalTextHeight = (lines.length - 1) * lineHeight;
    // const firstLineY = -totalTextHeight / 2;

    const textCenterY = heightUp + heightDown / 2;
    const startY = textCenterY - totalTextHeight / 2;

    const textLines = lines.map((line, i) => ({
        text: line,
        x: heightUp / 2,
        y: startY + i * lineHeight
    }));

    // --- RECTANGLES ---
    const blueRectD = `M${r + e / 2},${e / 2} h${heightUp - 2 * r - e} a${r},${r} 0 0 1 ${r},${r} v${heightUp - r - e / 2} h-${heightUp - e} v-${heightUp - r - e / 2} a${r},${r} 0 0 1 ${r},-${r}`;
    const whiteRectD = `M${e / 2},${heightUp} h${heightUp - e} v${heightDown - r - e / 2} a${r},${r} 0 0 1 -${r},${r} h-${heightUp - 2 * r - e} a${r},${r} 0 0 1 -${r},-${r} z`;

    return {
        width: heightUp,
        height: heightUp + heightDown,
        viewBox: `0 0 ${heightUp} ${heightUp + heightDown}`,
        colors: COLORS,
        blueRect: {
            d: blueRectD,
            fill: COLORS.blue
        },
        logo: {
            transform: logoTransform,
            paths: [
                { d: PATH_DISK, fill: COLORS.white },
                { d: PATH_ALPES, fill: COLORS.blue },
                { d: PATH_AUVERGNE, fill: COLORS.blue }
            ]
        },
        regionText: {
            transform: regionTransform,
            d: PATH_LA_REGION,
            fill: COLORS.white
        },
        whiteRect: {
            d: whiteRectD,
            fill: COLORS.white
        },
        customText: {
            lines: textLines,
            fontSize: fontSize * scale,
            fill: COLORS.black,
        },
        border: {
            x: e / 2,
            y: e / 2,
            width: heightUp - e,
            height: heightUp + heightDown - e,
            rx: r,
            ry: r,
            stroke: COLORS.grey,
            strokeWidth: e
        },
        styleTag: `
            ${panelColors}
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap');
            .panel-text { font-family: 'Graphik', 'Inter', 'Segoe UI', Arial, sans-serif; font-weight: bold; }
        `
    };
}
