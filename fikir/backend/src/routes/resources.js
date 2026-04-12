import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimits.js';
import { handleValidation, resourceSubjectRules } from '../middleware/validate.js';
import * as resourceController from '../controllers/resourceController.js';

export function createResourcesRouter() {
  const router = Router();
  router.use(requireAuth);

  router.get('/reference', (req, res) => resourceController.getReference(req, res));
  router.post(
    '/upload',
    uploadLimiter,
    (req, res, next) => {
      resourceController.uploadMiddleware.single('file')(req, res, (err) => {
        if (err) return resourceController.handleUploadError(err, req, res, next);
        next();
      });
    },
    (req, res) => resourceController.postUpload(req, res)
  );
  router.put(
    '/:id(\\d+)',
    resourceSubjectRules,
    handleValidation,
    (req, res) => resourceController.putResourceSubject(req, res)
  );
  router.delete('/:id(\\d+)', (req, res) => resourceController.deleteResource(req, res));
  router.get('/', (req, res) => resourceController.listResources(req, res));

  return router;
}
