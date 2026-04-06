import { Router } from 'express';
import multer from 'multer';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../config/cloudinary.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const isAllowedMimeType = (mimetype = '') =>
  mimetype.startsWith('image/') || mimetype === 'application/pdf';

const runUploadMiddleware = (request, response) =>
  new Promise((resolve, reject) => {
    upload.single('file')(request, response, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

router.post('/', async (request, response) => {
  try {
    await runUploadMiddleware(request, response);

    if (!isCloudinaryConfigured()) {
      response.status(503).json({
        success: false,
        message:
          'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.',
      });
      return;
    }

    if (!request.file) {
      response.status(400).json({ success: false, message: 'Please select a file to upload.' });
      return;
    }

    if (!isAllowedMimeType(request.file.mimetype)) {
      response.status(400).json({
        success: false,
        message: 'Only image files and PDF files are allowed.',
      });
      return;
    }

    const folder = String(request.body?.folder || '').trim();
    const asset = await uploadBufferToCloudinary({
      buffer: request.file.buffer,
      mimetype: request.file.mimetype,
      folder,
      originalName: request.file.originalname || '',
    });

    response.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      asset,
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      response.status(400).json({
        success: false,
        message:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'File size must be 10 MB or less.'
            : error.message || 'Unable to process file upload.',
      });
      return;
    }

    response.status(500).json({
      success: false,
      message: error.message || 'Unable to upload file.',
    });
  }
});

export default router;
