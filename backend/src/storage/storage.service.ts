import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
      this.logger.error('AWS Configuration is missing!');
    }

    this.s3Client = new S3Client({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';
    this.logger.log(`[Storage] Initialized with bucket: ${this.bucketName}`);
  }

  async uploadFile(file: any, folder: string = 'general'): Promise<string> {
    if (!file) {
      this.logger.error('No file provided for upload');
      throw new Error('No se recibió ningún archivo');
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      this.logger.log(`[S3] Initializing upload: ${fileName}`);
      this.logger.log(`[S3] Bucket: ${this.bucketName}, Region: ${this.configService.get('AWS_REGION')}`);
      this.logger.log(`[S3] File info: ${file.originalname}, ${file.mimetype}, size: ${file.buffer?.length}`);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      const response = await this.s3Client.send(command);
      this.logger.log(`[S3] Upload successful. ETag: ${response.ETag}`);

      // Retorna la URL del archivo
      const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    } catch (error) {
      this.logger.error(`[S3] Critical error uploading file: ${error.message}`);
      this.logger.error(`[S3] Stack trace: ${error.stack}`);
      if (error.$metadata) {
        this.logger.error(`[S3] AWS Metadata: ${JSON.stringify(error.$metadata)}`);
      }
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
      // Extrae el Key de la URL
      const urlParts = fileUrl.split('.amazonaws.com/');
      if (urlParts.length < 2) return;
      
      const key = urlParts[1];

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error.message}`);
    }
  }
}
