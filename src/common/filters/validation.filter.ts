import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Check if it's a validation error
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      const errors = exceptionResponse.message;

      // Format validation errors: show all constraint violations per field
      const formattedErrors: Record<string, string[]> = {};

      errors.forEach((error: ValidationError) => {
        if (error.constraints) {
          // Get all constraint messages
          const constraintMessages = Object.values(error.constraints) as string[];
          formattedErrors[error.property] = constraintMessages;
        }
      });

      console.log('❌ [Validation Error]', JSON.stringify(formattedErrors, null, 2));

      // If we have formatted errors, return them
      if (Object.keys(formattedErrors).length > 0) {
        return response.status(status).json({
          statusCode: status,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
    }

    // For non-validation errors, return as is
    console.log('❌ [Error Response]', exceptionResponse);
    response.status(status).json(exceptionResponse);
  }
}
