import { Controller, Get, Res } from '@nestjs/common';
import { existsSync } from 'fs';


@Controller('files')
export class FilesController {

    @Get('file/DefaultPicture')
    defaultImage(@Res() res: any) {
        res.sendFile(process.cwd() + "/DefaultAssets/DefaultPicture.png");
    }

    @Get('file/:fileName')
    downloadImage(@Res() res: any) {
        var path = process.cwd() + "/assets/" + res.req.params.fileName;
        if (!existsSync(path))
            path = process.cwd() + "/DefaultAssets/DefaultPicture.png";
        res.sendFile(path);
    }
}
