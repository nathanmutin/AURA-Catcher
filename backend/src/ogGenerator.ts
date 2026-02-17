import { Router } from 'express';
import { calculatePanelLayout } from '@aura-catcher/shared/generator/panelLayout';
import { renderPanelToString } from '@aura-catcher/shared/generator/panelRenderers';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import path from 'path';
import { FONT_DIR } from './config';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const text = req.query.text as string || 'La Région soutient la raclette';
        const imageBuffer = await generateOgImage(text);
        res.set('Content-Type', 'image/webp');
        res.send(imageBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating image');
    }
});

export async function generateOgImage(text: string): Promise<Buffer> {
    const layout = calculatePanelLayout(text, 470, false);
    const svgString = renderPanelToString(layout);

    // Initialize resvg
    const resvg = new Resvg(svgString, {
        font: {
            fontFiles: [path.join(FONT_DIR, 'Inter.ttf')],
            loadSystemFonts: false,
        },
    });

    const pngBuffer = resvg.render().asPng();

    // Convert to WebP using sharp for final output (matching previous behavior)
    return sharp(pngBuffer)
        // 1200x630 is standard OG size.
        .resize(1200, 630, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 40 })
        .toBuffer();
}

export default router;
