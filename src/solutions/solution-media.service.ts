import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Client } from 'minio';

export type MediaKind = 'image' | 'video';

const EXTENSIONS: Record<MediaKind, Record<string, string>> = {
  image: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  },
  video: {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
  },
};

@Injectable()
export class SolutionMediaService {
  private readonly client: Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.get('MINIO_BUCKET', 'solution-assets');
    this.client = new Client({
      endPoint: config.get('MINIO_ENDPOINT', 'localhost'),
      port: Number(config.get('MINIO_PORT', 9000)),
      useSSL: config.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: config.get('MINIO_ACCESS_KEY', 'root'),
      secretKey: config.get('MINIO_SECRET_KEY', 'rootpassword'),
    });
  }

  async upload(file: Express.Multer.File, kind: MediaKind): Promise<string> {
    const extension = EXTENSIONS[kind][file.mimetype];
    if (!extension) {
      const allowed = Object.keys(EXTENSIONS[kind]).join(', ');
      throw new BadRequestException(`Неподдерживаемый тип файла ${file.mimetype}, допустимы: ${allowed}`);
    }

    const key = `solution-${kind}-${randomUUID()}.${extension}`;
    await this.client.putObject(this.bucket, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return key;
  }

  async remove(key: string): Promise<void> {
    if (!key) return;
    await this.client.removeObject(this.bucket, key);
  }
}
