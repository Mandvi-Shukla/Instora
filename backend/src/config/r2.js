const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const uploadThumbnailToR2 = async (buffer, mimeType, key) => {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
};

const deleteFromR2 = async (key) => {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  }));
};
const getPrivateUploadUrl = async (key, contentType) => {
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: process.env.R2_PRIVATE_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 600 } // 10 minutes to complete the upload
  );
  return url;
};

// New: presigned watch/download URL for a purchased lecture/note (private bucket)
const getPrivateWatchUrl = async (key, expiresIn = 7200) => {
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: process.env.R2_PRIVATE_BUCKET, Key: key }),
    { expiresIn }
  );
  return url;
};

const deleteFromPrivateBucket = async (key) => {
  await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_PRIVATE_BUCKET, Key: key }));
};

module.exports = {
  r2, uploadThumbnailToR2, deleteFromR2,
  getPrivateUploadUrl, getPrivateWatchUrl, deleteFromPrivateBucket,
};