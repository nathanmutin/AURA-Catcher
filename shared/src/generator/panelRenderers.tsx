import type { PanelLayout } from './panelLayout';

export function renderPanelToString(layout: PanelLayout): string {
    const logoPaths = layout.logo.paths.map(p => `<path d="${p.d}" fill="${p.fill}"/>`).join('');

    const textSpans = layout.customText.lines.map(line =>
        `<tspan x="${line.x}" y="${line.y}">${line.text}</tspan>`
    ).join('');

    return `
<svg width="${layout.width}" height="${layout.height}" viewBox="${layout.viewBox}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>${layout.styleTag}</style>
    </defs>
    <g>
        <path d="${layout.blueRect.d}" fill="${layout.blueRect.fill}"/>
        <g transform="${layout.logo.transform}">
            ${logoPaths}
        </g>
        <path d="${layout.regionText.d}" fill="${layout.regionText.fill}" transform="${layout.regionText.transform}"/>
    </g>
    <g>
        <path d="${layout.whiteRect.d}" fill="${layout.whiteRect.fill}"/>
        <text class="panel-text" fill="${layout.customText.fill}" text-anchor="middle" dominant-baseline="middle" font-size="${layout.customText.fontSize}">
            ${textSpans}
        </text>
    </g>
    <rect x="${layout.border.x}" y="${layout.border.y}" width="${layout.border.width}" height="${layout.border.height}" rx="${layout.border.rx}" ry="${layout.border.ry}" fill="none" stroke="${layout.border.stroke}" stroke-width="${layout.border.strokeWidth}"/>
</svg>`.trim();
}
