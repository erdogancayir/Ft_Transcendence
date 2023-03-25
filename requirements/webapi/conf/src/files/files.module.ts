import { Module } from "@nestjs/common";
import { FilesController } from "./files.service";

@Module({
    controllers: [FilesController]
})
export class FilesModule {}