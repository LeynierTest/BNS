import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import type {
  AuthenticatedRequest,
} from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Roles('Administrator')
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Roles('Administrator')
  @Get('search')
  async search(
    @Query('username') username?: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('active') active?: string,
  ) {
    return this.usersService.searchUsers(
      username,
      email,
      role,
      active !== undefined ? active === 'true' : undefined,
    );
  }

  @Roles('Administrator')
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.getUserById(id);
  }

  @Roles('Administrator')
  @Post()
  async createUser(
    @Body() data: CreateUserDto,
  ) {
    return this.usersService.createUser(data);
  }

  @Roles('Administrator')
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    const requesterId = request.user?.sub;

    if (!requesterId) {
      throw new Error('Usuario autenticado no identificado');
    }

    return this.usersService.deleteUser(
      id,
      requesterId,
    );
  }

  @Roles('Administrator')
  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const requesterId = request.user?.sub;

    if (!requesterId) {
      throw new Error('Usuario autenticado no identificado');
    }

    return this.usersService.updateUser(
      id,
      data,
      requesterId,
    );
  }
}
