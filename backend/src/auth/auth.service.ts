import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  private getAccessTokenTtlSeconds() {
    const raw = this.configService.get<string>('JWT_ACCESS_TTL_SECONDS');
    const ttl = raw ? Number(raw) : 900;
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 900;
  }

  private getRefreshTokenTtlDays() {
    const raw = this.configService.get<string>('JWT_REFRESH_TTL_DAYS');
    const ttl = raw ? Number(raw) : 30;
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 30;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async registerTenant(dto: RegisterTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: {
        slug: dto.tenantSlug,
      },
    });

    if (existing) {
      throw new BadRequestException('Tenant slug already exists');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          slug: dto.tenantSlug,
        },
      });

      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: dto.branchName,
          code: dto.branchCode,
        },
      });

      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Admin',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return { tenant, branch, role, user };
    });

    return {
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
      adminUserId: result.user.id,
    };
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug: dto.tenantSlug,
      },
    });

    if (!tenant) {
      throw new ForbiddenException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new ForbiddenException('Invalid credentials');
    }

    const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        tenantId: tenant.id,
      },
      {
        expiresIn: accessTokenTtlSeconds,
      } as any,
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tenantId: tenant.id,
      userId: user.id,
    };
  }

  async refresh(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const accessTokenTtlSeconds = this.getAccessTokenTtlSeconds();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: session.userId,
        tenantId: session.user.tenantId,
      },
      {
        expiresIn: accessTokenTtlSeconds,
      } as any,
    );

    const newRefreshToken = randomBytes(48).toString('hex');
    const newRefreshTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      this.prisma.session.create({
        data: {
          userId: session.userId,
          tokenHash: newRefreshTokenHash,
          expiresAt,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    // Find the session to get the userId
    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: refreshTokenHash,
        revokedAt: null,
      },
    });

    if (!session) {
      // Even if session not found, return ok (idempotent)
      return { ok: true };
    }

    // Revoke ALL sessions for this user (logout from all devices)
    await this.prisma.session.updateMany({
      where: {
        userId: session.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { ok: true };
  }

  async cleanupExpiredSessions() {
    // Delete sessions that have been expired for more than 7 days
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: cutoffDate,
            },
          },
          {
            revokedAt: {
              lt: cutoffDate,
            },
          },
        ],
      },
    });
  }
}
