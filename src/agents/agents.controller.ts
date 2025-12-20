import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const documentStorage = diskStorage({
  destination: './uploads/documents',
  filename: (req, file, callback) => {
    const uniqueName = `${uuid()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

const documentFileFilter = (req, file, callback) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedMimes.includes(file.mimetype)) {
    return callback(
      new Error('Only PDF, images, and Word documents are allowed!'),
      false,
    );
  }
  callback(null, true);
};

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  // GET /api/agents/profile - Get current agent profile
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async getProfile(@Request() req) {
    console.log('Agent profile request - User ID:', req.user.userId, 'Role:', req.user.role, 'Email:', req.user.email);
    return this.agentsService.getProfile(req.user.userId);
  }

  // GET /api/agents/:agentId - Get agent by ID
  @Get(':agentId')
  @UseGuards(JwtAuthGuard)
  async getAgent(@Param('agentId', ParseIntPipe) agentId: number) {
    return this.agentsService.getProfile(agentId);
  }

  // PUT /api/agents/:agentId - Update agent profile
  @Put(':agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async updateProfile(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Body() updateData: Partial<any>,
    @Request() req,
  ) {
    // Agents can only update their own profile
    if (req.user.userId !== agentId && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.agentsService.updateProfile(agentId, updateData);
  }

  // GET /api/agents/:agentId/revenue - Get agent revenue
  @Get(':agentId/revenue')
  @UseGuards(JwtAuthGuard)
  async getRevenue(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Request() req,
  ) {
    // Agents can only view their own revenue (unless admin)
    if (req.user.userId !== agentId && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.agentsService.getRevenue(agentId);
  }

  // GET /api/agents/:agentId/dashboard - Get agent dashboard
  @Get(':agentId/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'superadmin')
  async getDashboard(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Request() req,
  ) {
    // Agents can only view their own dashboard
    if (req.user.userId !== agentId && req.user.role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    return this.agentsService.getDashboard(agentId);
  }

  // PUT /api/agents/:agentId/upload-approval - Upload approval documents
  @Put(':agentId/upload-approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: documentStorage,
      fileFilter: documentFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadApprovalDocuments(
    @Param('agentId', ParseIntPipe) agentId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    // Agents can only upload their own documents
    if (req.user.userId !== agentId) {
      throw new Error('Unauthorized');
    }

    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const documentPath = `documents/${file.filename}`;
    return this.agentsService.uploadApprovalDocuments(agentId, documentPath);
  }
}
