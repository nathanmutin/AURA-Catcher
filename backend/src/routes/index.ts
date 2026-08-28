import { Router } from 'express';
import panneauxRoutes from './panneaux';
import photosRoutes from './photos';
import statsRoutes from './stats';
import typesRoutes from './types';

const router = Router();

router.use(panneauxRoutes);
router.use(photosRoutes);
router.use(statsRoutes);
router.use(typesRoutes);

export default router;
