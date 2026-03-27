import { S3Client, PutObjectCommand, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testS3() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  console.log('Testing S3 PutObject to bucket:', bucketName);
  
  const client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  try {
    const key = `products/test-upload-${Date.now()}.txt`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: 'Hello AWS S3!',
      ContentType: 'text/plain',
    });

    const data = await client.send(command);
    console.log('S3 PutObject Successful!');
    console.log('Response:', data);
    console.log('File uploaded with key:', key);
  } catch (err) {
    console.error('S3 PutObject Failed!');
    console.error(err);
  }
}

testS3();
