import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Role } from './enums/role.enum';
import { TokenPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Registro ───────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const { username, email, password } = dto;

    // Check email
    const existingEmail = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // Check username
    const existingUsername = await this.prisma.users.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('El username ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.prisma.users.create({
      data: {
        username,
        email,
        password_hash: passwordHash,
        dni: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user_type: 'cliente', // legacy field — required by schema but being phased out
        role: Role.USER,
        is_public: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_public: true,
        created_at: true,
      },
    });

    this.logger.log(`✅ Usuario registrado: ${username}`);

    const [accessToken, refreshToken] = await this.generateTokens(
      user.id,
      user.role,
    );

    return { user, accessToken, refreshToken };
  }

  // ─── Login ─────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const [accessToken, refreshToken] = await this.generateTokens(
      user.id,
      user.role,
    );

    this.logger.log(`✅ Login exitoso: ${user.username}`);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // ─── Logout ────────────────────────────────────────────────

  async logout(userId: number) {
    // Revocar todos los refresh tokens del usuario
    await this.prisma.refresh_tokens.updateMany({
      where: { user_id: userId },
      data: { revoked: true },
    });

    this.logger.log(`✅ Logout: userId=${userId}`);
    return { message: 'Sesión cerrada correctamente' };
  }

  // ─── Refresh Token ─────────────────────────────────────────

  async refreshTokens(refreshToken: string) {
    const storedToken = await this.prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedException('Refresh token inválido o revocado');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Revocar el token usado (rotación)
    await this.prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const user = await this.prisma.users.findUnique({
      where: { id: storedToken.user_id },
      select: { id: true, role: true, is_active: true },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    const [accessToken, newRefreshToken] = await this.generateTokens(
      user.id,
      user.role,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ─── Helpers ───────────────────────────────────────────────

  async validateUser(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        is_public: true,
        instagram: true,
        twitter: true,
        facebook: true,
        whatsapp: true,
        discord: true,
        konami_id: true,
      },
    });

    if (!user || !user.is_active) return null;
    return user;
  }

  private async generateTokens(
    userId: number,
    role: string,
  ): Promise<[string, string]> {
    const payload: TokenPayload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: 604800, // 7 days in seconds
    });

    // Guardar refresh token en la DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        token: refreshToken,
        expires_at: expiresAt,
      },
    });

    return [accessToken, refreshToken];
  }
}
