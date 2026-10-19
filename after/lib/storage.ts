import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
  },
});

/** A link to one private attachment that works for 60 seconds. */
export const signedAttachmentUrl = (path: string) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.ATTACHMENTS_BUCKET, Key: path }), {
    expiresIn: 60,
  });
