import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Request() req,
  ) {
    if (!documentType) {
      throw new BadRequestException('Document type is required');
    }

    const agentId = req.user.sub || req.user.id;

    try {
      const document = await this.documentsService.uploadDocument(
        agentId,
        file,
        documentType,
      );

      return {
        success: true,
        message: 'Document uploaded successfully',
        data: document,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('my-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async getMyDocuments(@Request() req) {
    const agentId = req.user.sub || req.user.id;
    const documents = await this.documentsService.getAgentDocuments(agentId);

    return {
      success: true,
      data: documents,
    };
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async getPendingDocuments() {
    const documents = await this.documentsService.getAllPendingDocuments();

    return {
      success: true,
      data: documents,
    };
  }

  @Get('agent/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async getAgentDocuments(@Param('agentId', ParseIntPipe) agentId: number) {
    const documents = await this.documentsService.getAgentDocuments(agentId);

    return {
      success: true,
      data: documents,
    };
  }

  @Put(':documentId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async verifyDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() body: { approved: boolean; rejectionReason?: string },
    @Request() req,
  ) {
    const adminId = req.user.sub || req.user.id;

    const document = await this.documentsService.verifyDocument(
      documentId,
      adminId,
      body.approved,
      body.rejectionReason,
    );

    // If approved, check if all documents are verified
    if (body.approved) {
      await this.documentsService.approveAgentAfterDocuments(document.agentId);
    }

    return {
      success: true,
      message: `Document ${body.approved ? 'verified' : 'rejected'} successfully`,
      data: document,
    };
  }

  @Delete(':documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async deleteDocument(@Param('documentId', ParseIntPipe) documentId: number, @Request() req) {
    const agentId = req.user.sub || req.user.id;

    try {
      await this.documentsService.deleteDocument(documentId, agentId);

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('submit-for-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async submitDocumentsForReview(@Request() req) {
    const agentId = req.user.sub || req.user.id;

    try {
      await this.documentsService.submitDocumentsForReview(agentId);

      return {
        success: true,
        message: 'Documents submitted for review successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}
