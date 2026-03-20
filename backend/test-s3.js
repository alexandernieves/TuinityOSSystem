
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function testPut() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  console.log(`Testing PutObject to ${bucketName}...`);
  const client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  try {
    const data = await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'test-connection.txt',
      Body: 'Connection Test'
    }));
    console.log('Success! PutObject worked.', data.$metadata.httpStatusCode);
  } catch (err) {
    console.error('Error testing PutObject:', err.message);
  }
}

testPut();
