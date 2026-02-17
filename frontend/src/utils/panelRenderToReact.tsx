import type { PanelLayout } from "@aura-catcher/shared/generator/panelLayout";
import React from "react";

export function renderPanelToReact(
    layout: PanelLayout,
    hideText: boolean = false,
    editing?: { value: string, onChange: (val: string) => void }
): React.ReactElement {
    return (
        <svg
            width={layout.width}
            height={layout.height}
            viewBox={layout.viewBox}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <style dangerouslySetInnerHTML={{ __html: layout.styleTag }} />
            </defs>

            {/* Blue Rect Group */}
            <g>
                <path d={layout.blueRect.d} fill={layout.blueRect.fill} />
                <g transform={layout.logo.transform}>
                    {layout.logo.paths.map((p, i) => (
                        <path key={i} d={p.d} fill={p.fill} />
                    ))}
                </g>
                <path
                    d={layout.regionText.d}
                    fill={layout.regionText.fill}
                    transform={layout.regionText.transform}
                />
            </g>

            {/* White Rect Group */}
            <g>
                <path d={layout.whiteRect.d} fill={layout.whiteRect.fill} />
                {editing ? (
                    <foreignObject
                        x={layout.border.x}
                        y={layout.height - (layout.height * 0.235)} /* Approximate Y start of white area */
                        width={layout.border.width}
                        height={layout.height * 0.32}
                        style={{ overflow: 'visible' }} // Ensure content can be seen
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                            }}
                        >
                            <textarea
                                value={editing.value}
                                onChange={(e) => editing.onChange(e.target.value.replace(/\n/g, ' '))}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    textAlign: 'center',
                                    fontFamily: "'Graphik', 'Inter', 'Segoe UI', Arial, sans-serif",
                                    fontWeight: 'bold',
                                    fontSize: `${layout.customText.fontSize}px`,
                                    lineHeight: `${layout.customText.fontSize * 1.2}px`,
                                    color: layout.customText.fill,
                                    overflow: 'hidden',
                                    padding: 0,
                                    margin: 0,
                                }}
                                spellCheck={false}
                            />
                        </div>
                    </foreignObject>
                ) : (
                    !hideText && (
                        <text
                            className="panel-text"
                            fill={layout.customText.fill}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={layout.customText.fontSize}
                        >
                            {layout.customText.lines.map((line, i) => (
                                <tspan key={i} x={line.x} y={line.y}>
                                    {line.text}
                                </tspan>
                            ))}
                        </text>
                    )
                )}
            </g>

            {/* Border */}
            <rect
                x={layout.border.x}
                y={layout.border.y}
                width={layout.border.width}
                height={layout.border.height}
                rx={layout.border.rx}
                ry={layout.border.ry}
                fill="none"
                stroke={layout.border.stroke}
                strokeWidth={layout.border.strokeWidth}
            />
        </svg>
    );
}