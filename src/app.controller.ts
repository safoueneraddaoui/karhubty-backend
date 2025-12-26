import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('init/superadmin')
  async initSuperAdmin(@Body() body: { email: string; password: string }) {
    return this.appService.initSuperAdmin(body.email, body.password);
  }

  @Post('reset/superadmin-password')
  async resetSuperAdminPassword(@Body() body: { email: string; newPassword: string }) {
    return this.appService.resetSuperAdminPassword(body.email, body.newPassword);
  }
}
