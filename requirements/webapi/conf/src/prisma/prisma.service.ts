import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config : ConfigService ) {
    super({
      datasources: {
        db: {
          url: "postgresql://hiqermod:123@95.70.251.21:5432/omer_db?schema=public",
        },
      },
    });
  }
}
