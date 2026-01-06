import express from 'express';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { initDb } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads dir
const uploadsDir = path.join(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.get('/', (req, res) => {
    res.send('AURA Catcher Backend is running. Access API at /api/panneaux');
});

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/api', routes);

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to init DB:', err);
});
