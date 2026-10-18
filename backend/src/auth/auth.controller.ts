import {
  Body,
  Controller,
  Delete,
  Get,
  FileTypeValidator,
  Ip,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import {
  ACCESS_TOKEN_COOKIE,
  AVATAR_ALLOWED_MIME_TYPE,
  MAX_AVATAR_SIZE_BYTES,
  accessTokenCookieOptions,
  clearAccessTokenCookieOptions,
} from './auth.constants';
import type { AuthenticatedRequest } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, user } =
      await this.authService.login(data, ip);

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      accessTokenCookieOptions(),
    );

    return { user };
  }

  @Public()
  @Post('logout')
  logout(
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie(
      ACCESS_TOKEN_COOKIE,
      clearAccessTokenCookieOptions(),
    );

    return { success: true };
  }

  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    const user = await this.authService.getProfile(
      request.user!.sub,
    );

    return { user };
  }

  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
    }),
  )
  async updatePhoto(
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_AVATAR_SIZE_BYTES,
          }),
          new FileTypeValidator({
            fileType: AVATAR_ALLOWED_MIME_TYPE,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const user = await this.authService.updatePhoto(
      request.user!.sub,
      file.buffer,
    );

    return { user };
  }

  @Delete('me/photo')
  async removePhoto(
    @Req() request: AuthenticatedRequest,
  ) {
    const user = await this.authService.removePhoto(
      request.user!.sub,
    );

    return { user };
  }
}
