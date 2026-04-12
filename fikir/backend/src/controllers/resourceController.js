import multer from 'multer';
import { pool } from '../config/db.js';
import { cloudinary, isCloudinaryConfigured, configureCloudinary } from '../config/cloudinary.js';

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Curated official-style references (external links + one stable sample PDF). */
export const REFERENCE_MATERIALS = [
  {
    id: 'ref-openstax-algebra',
    title: 'OpenStax — Algebra & Trigonometry (free textbook)',
    description: 'Formulas, graphs, and problem sets useful for EUEE-style quantitative reasoning.',
    category: 'formula_sheet',
    fileType: 'link',
    url: 'https://openstax.org/details/books/algebra-and-trigonometry-2e',
  },
  {
    id: 'ref-openstax-physics',
    title: 'OpenStax — University Physics Volume 1',
    description: 'Mechanics and waves fundamentals with worked examples.',
    category: 'subject_guide',
    fileType: 'link',
    url: 'https://openstax.org/details/books/university-physics-volume-1',
  },
  {
    id: 'ref-moe-ethiopia',
    title: 'Ministry of Education — Ethiopia',
    description: 'Official portal for national education context, news, and policy.',
    category: 'exam_guide',
    fileType: 'link',
    url: 'https://www.moe.gov.et/',
  },
  {
    id: 'ref-time-management',
    title: 'Time management for students (UNC Learning Center)',
    description: 'Pacing, weekly planning, and focus blocks that match a serious EUEE prep cadence.',
    category: 'study_skills',
    fileType: 'link',
    url: 'https://learningcenter.unc.edu/tips-and-tools/time-management/',
  },
  {
    id: 'ref-sample-pdf',
    title: 'Sample PDF (connectivity check)',
    description: 'Small public-domain-style sample file useful to verify downloads on your device.',
    category: 'other',
    fileType: 'pdf',
    url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/filename.pdf',
  },
];

function buildThumbnail(secureUrl, mimeType) {
  if (!secureUrl || !mimeType || !mimeType.startsWith('image/')) return null;
  return secureUrl.replace('/upload/', '/upload/c_thumb,w_220,h_220,q_auto,f_auto/');
}

function mapUploadRow(r) {
  const mimeType = r.mime_type || 'application/octet-stream';
  return {
    id: r.id,
    fileName: r.file_name,
    cloudinaryUrl: r.cloudinary_url,
    publicId: r.cloudinary_public_id,
    resourceType: r.cloudinary_resource_type,
    mimeType,
    fileBytes: r.file_bytes,
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    thumbnailUrl: buildThumbnail(r.cloudinary_url, mimeType),
    uploadedAt: r.uploaded_at,
  };
}

export async function getReference(req, res) {
  return res.json({ success: true, reference: REFERENCE_MATERIALS });
}

export async function listResources(req, res) {
  const userId = req.user.sub;
  try {
    const { rows } = await pool.query(
      `
        SELECT
          sm.id,
          sm.file_name,
          sm.cloudinary_url,
          sm.cloudinary_public_id,
          sm.cloudinary_resource_type,
          sm.mime_type,
          sm.file_bytes,
          sm.subject_id,
          sm.uploaded_at,
          s.name AS subject_name
        FROM study_materials sm
        LEFT JOIN subjects s ON s.id = sm.subject_id
        WHERE sm.user_id = $1
        ORDER BY sm.uploaded_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      uploads: rows.map(mapUploadRow),
      reference: REFERENCE_MATERIALS,
    });
  } catch (err) {
    console.error('listResources:', err);
    return res.status(500).json({ success: false, error: 'Failed to load resources.' });
  }
}

export async function postUpload(req, res) {
  const userId = req.user.sub;
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'File uploads are not configured. Set CLOUDINARY_* environment variables on the server.',
    });
  }
  configureCloudinary();

  if (!req.file?.buffer) {
    return res.status(400).json({ success: false, error: 'File is required (field name: file).' });
  }

  const subjectIdRaw = req.body?.subjectId;
  const subjectId =
    subjectIdRaw != null && subjectIdRaw !== ''
      ? Number(subjectIdRaw)
      : null;
  if (subjectId != null && (!Number.isInteger(subjectId) || subjectId < 1)) {
    return res.status(400).json({ success: false, error: 'Invalid subjectId.' });
  }
  if (subjectId != null) {
    const s = await pool.query(`SELECT id FROM subjects WHERE id = $1`, [subjectId]);
    if (!s.rows.length) {
      return res.status(400).json({ success: false, error: 'Subject not found.' });
    }
  }

  const file = req.file;
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    return res.status(400).json({ success: false, error: 'Unsupported file type.' });
  }
  if (file.size > MAX_BYTES) {
    return res.status(400).json({ success: false, error: 'File exceeds 10MB limit.' });
  }

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const safeName = (file.originalname || 'upload').replace(/[^\w.\-]+/g, '_').slice(0, 200);

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'fikir/study_materials',
      resource_type: 'auto',
      use_filename: true,
      filename_override: safeName,
      unique_filename: true,
    });

    const publicId = result.public_id;
    const secureUrl = result.secure_url;
    const resourceType = result.resource_type || 'image';

    const ins = await pool.query(
      `
        INSERT INTO study_materials (
          user_id, file_name, cloudinary_url, subject_id, tags,
          cloudinary_public_id, cloudinary_resource_type, mime_type, file_bytes
        )
        VALUES ($1, $2, $3, $4, '[]'::jsonb, $5, $6, $7, $8)
        RETURNING id, file_name, cloudinary_url, cloudinary_public_id, cloudinary_resource_type,
                  mime_type, file_bytes, subject_id, uploaded_at
      `,
      [
        userId,
        safeName,
        secureUrl,
        subjectId,
        publicId,
        resourceType,
        file.mimetype,
        file.size,
      ]
    );

    const row = ins.rows[0];
    const subName =
      subjectId != null
        ? (await pool.query(`SELECT name FROM subjects WHERE id = $1`, [subjectId])).rows[0]?.name
        : null;

    return res.status(201).json({
      success: true,
      upload: mapUploadRow({ ...row, subject_name: subName }),
    });
  } catch (err) {
    console.error('postUpload:', err);
    return res.status(500).json({ success: false, error: err.message || 'Upload failed.' });
  }
}

export async function putResourceSubject(req, res) {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid id.' });
  }

  const subjectIdRaw = req.body?.subjectId;
  const subjectId =
    subjectIdRaw != null && subjectIdRaw !== '' ? Number(subjectIdRaw) : null;
  if (subjectId != null && (!Number.isInteger(subjectId) || subjectId < 1)) {
    return res.status(400).json({ success: false, error: 'Invalid subjectId.' });
  }
  if (subjectId != null) {
    const s = await pool.query(`SELECT id FROM subjects WHERE id = $1`, [subjectId]);
    if (!s.rows.length) {
      return res.status(400).json({ success: false, error: 'Subject not found.' });
    }
  }

  try {
    const { rows } = await pool.query(
      `
        UPDATE study_materials
        SET subject_id = $1
        WHERE id = $2 AND user_id = $3
        RETURNING id, file_name, cloudinary_url, cloudinary_public_id, cloudinary_resource_type,
                  mime_type, file_bytes, subject_id, uploaded_at
      `,
      [subjectId, id, userId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Material not found.' });
    }
    const subName =
      subjectId != null
        ? (await pool.query(`SELECT name FROM subjects WHERE id = $1`, [subjectId])).rows[0]?.name
        : null;
    return res.json({ success: true, upload: mapUploadRow({ ...rows[0], subject_name: subName }) });
  } catch (err) {
    console.error('putResourceSubject:', err);
    return res.status(500).json({ success: false, error: 'Failed to update material.' });
  }
}

export async function deleteResource(req, res) {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid id.' });
  }

  try {
    const { rows } = await pool.query(
      `
        SELECT id, cloudinary_public_id, cloudinary_resource_type
        FROM study_materials
        WHERE id = $1 AND user_id = $2
      `,
      [id, userId]
    );
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ success: false, error: 'Material not found.' });
    }

    if (row.cloudinary_public_id && isCloudinaryConfigured()) {
      configureCloudinary();
      const rt = (row.cloudinary_resource_type || 'image').toLowerCase();
      const resourceType = rt === 'raw' ? 'raw' : rt === 'video' ? 'video' : 'image';
      try {
        await cloudinary.uploader.destroy(row.cloudinary_public_id, { resource_type: resourceType });
      } catch (e) {
        console.error('cloudinary destroy:', e?.message || e);
      }
    }

    await pool.query(`DELETE FROM study_materials WHERE id = $1 AND user_id = $2`, [id, userId]);
    return res.json({ success: true, id });
  } catch (err) {
    console.error('deleteResource:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete material.' });
  }
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: PDF, images, Word documents.'));
    }
  },
});

export function handleUploadError(err, req, res, next) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File exceeds 10MB limit.' });
    }
    return res.status(400).json({ success: false, error: err.message || 'Upload error.' });
  }
  if (err.message) {
    return res.status(400).json({ success: false, error: err.message });
  }
  return next(err);
}
