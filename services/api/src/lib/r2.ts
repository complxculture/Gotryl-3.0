import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

function makeR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT ?? '',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

function isR2Configured(): boolean {
  return !!(process.env.R2_BUCKET && process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID);
}

export async function fetchJsonFromR2(key: string): Promise<Record<string, unknown> | null> {
  if (!isR2Configured()) return null;
  try {
    const resp = await makeR2Client().send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET ?? '',
      Key: key,
    }));
    const body = await resp.Body?.transformToString('utf-8');
    return body ? (JSON.parse(body) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function fetchFailureBundle(runId: string): Promise<Record<string, unknown> | null> {
  return fetchJsonFromR2(`runs/${runId}/failure-bundle.json`);
}
