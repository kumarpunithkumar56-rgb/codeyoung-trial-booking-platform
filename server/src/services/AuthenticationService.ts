import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AUTH_CONFIG } from '../config/constants';

const prisma = new PrismaClient();

interface SignupData {
  email: string;
  password: string;
  role: UserRole;
  timezone: string;
  profileData: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    bio?: string;
    photoUrl?: string;
  };
}

interface TokenPayload {
  userId: string;
  role: UserRole;
  timezone: string;
}

class AuthenticationService {
  async signup(data: SignupData): Promise<{ user: any; token: string }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        timezone: data.timezone,
        ...(data.role === 'PARENT' && {
          parentProfile: {
            create: {
              firstName: data.profileData.firstName,
              lastName: data.profileData.lastName,
              phoneNumber: data.profileData.phoneNumber,
            },
          },
        }),
        ...(data.role === 'MENTOR' && {
          mentorProfile: {
            create: {
              firstName: data.profileData.firstName,
              lastName: data.profileData.lastName,
              bio: data.profileData.bio,
              photoUrl: data.profileData.photoUrl,
              active: true,
            },
          },
        }),
      },
      include: {
        parentProfile: true,
        mentorProfile: true,
      },
    });

    const token = this.generateToken({
      userId: user.id,
      role: user.role,
      timezone: user.timezone,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        parentProfile: true,
        mentorProfile: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({
      userId: user.id,
      role: user.role,
      timezone: user.timezone,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async logout(_userId: string): Promise<void> {
    return;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const resetToken = this.generateResetToken();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + AUTH_CONFIG.RESET_TOKEN_EXPIRY_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        message: `Password reset requested. Token: ${resetToken}`,
        metadata: { resetToken },
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const users = await prisma.user.findMany({
      where: {
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    let user = null;
    for (const u of users) {
      if (u.resetToken) {
        const isValid = await bcrypt.compare(token, u.resetToken);
        if (isValid) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  async validateToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      return payload;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONFIG.SALT_ROUNDS);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: AUTH_CONFIG.TOKEN_EXPIRY,
      issuer: 'codeyoung-platform',
    });
  }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default new AuthenticationService();
