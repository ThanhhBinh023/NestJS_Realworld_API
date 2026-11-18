import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UploadService } from './upload.service.js';
import { UploadImageDto } from './dto/upload-image.dto.js';
import { UploadImageResponseDto } from './dto/upload-image-response.dto.js';
import { imageMulterOptions } from './utils/multer-image.config.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiOperation({
    summary: 'Upload an image file for articles or general media',
  })
  @ApiOkResponse({
    description: 'Image uploaded successfully',
    type: UploadImageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format or file size exceeded',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  async uploadImage(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    return this.uploadService.uploadImage(file);
  }
}
