import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.UNAUTHORIZED) {
    super(message, status);
  }
}

export class InvalidCredentialsException extends AuthException {
  constructor() {
    super('Credenciales inválidas', HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends AuthException {
  constructor() {
    super('Token expirado', HttpStatus.UNAUTHORIZED);
  }
}

export class UserAlreadyExistsException extends AuthException {
  constructor(field: 'email' | 'username') {
    super(`El ${field} ya está registrado`, HttpStatus.CONFLICT);
  }
}