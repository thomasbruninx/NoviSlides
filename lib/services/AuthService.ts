import { createHash, randomBytes } from 'crypto';
import type { EditorSession } from '@prisma/client';
import {
  getDefaultEditorPassword,
  hashPassword,
  LEGACY_DEFAULT_EDITOR_PASSWORD_HASH,
  verifyPassword
} from '@/lib/auth/password';
import { EditorAuthRepository, EditorSessionRepository } from '@/lib/repositories';

const NON_REMEMBER_SESSION_DURATION_MS = 1000 * 60 * 60 * 24;
const REMEMBER_SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

type CreatedEditorSession = {
  token: string;
  rememberMe: boolean;
};

export class AuthInvalidCredentialsError extends Error {
  code = 'invalid_credentials' as const;
}

export class AuthUnauthorizedError extends Error {
  code = 'unauthorized' as const;
}

export class AuthService {
  private authRepo = new EditorAuthRepository();
  private sessionRepo = new EditorSessionRepository();

  async login(password: string, rememberMe: boolean): Promise<CreatedEditorSession> {
    await this.sessionRepo.deleteExpired();
    const config = await this.ensureAuthConfig();
    const valid = verifyPassword(password, config.passwordHash);
    if (!valid) {
      throw new AuthInvalidCredentialsError('Invalid password');
    }

    return this.createSession(rememberMe);
  }

  async isSessionValid(token: string): Promise<boolean> {
    const session = await this.getValidSessionByToken(token);
    return Boolean(session);
  }

  async logout(token: string): Promise<void> {
    const tokenHash = this.hashSessionToken(token);
    await this.sessionRepo.deleteByTokenHash(tokenHash);
  }

  async updatePassword(token: string, password: string): Promise<CreatedEditorSession> {
    const currentSession = await this.getValidSessionByToken(token);
    if (!currentSession) {
      throw new AuthUnauthorizedError('Unauthorized');
    }

    const newHash = hashPassword(password);
    await this.ensureAuthConfig();
    await this.authRepo.updatePasswordHash(newHash);

    await this.sessionRepo.deleteAll();

    return this.createSession(currentSession.rememberMe);
  }

  private async ensureAuthConfig() {
    const existing = await this.authRepo.getConfig();
    if (existing) {
      // One-time migration away from the previous hardcoded legacy default hash.
      if (existing.passwordHash === LEGACY_DEFAULT_EDITOR_PASSWORD_HASH) {
        return this.authRepo.updatePasswordHash(hashPassword(getDefaultEditorPassword()));
      }
      return existing;
    }

    const fallbackHash = hashPassword(getDefaultEditorPassword());
    try {
      return await this.authRepo.createConfig(fallbackHash);
    } catch {
      const createdByParallelRequest = await this.authRepo.getConfig();
      if (createdByParallelRequest) {
        return createdByParallelRequest;
      }
      throw new Error('Failed to initialize auth configuration');
    }
  }

  private async createSession(rememberMe: boolean): Promise<CreatedEditorSession> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashSessionToken(token);
    const expiresAt = new Date(
      Date.now() + (rememberMe ? REMEMBER_SESSION_DURATION_MS : NON_REMEMBER_SESSION_DURATION_MS)
    );

    await this.sessionRepo.create({
      tokenHash,
      rememberMe,
      expiresAt
    });

    return { token, rememberMe };
  }

  private async getValidSessionByToken(token: string): Promise<EditorSession | null> {
    if (!token) return null;

    await this.sessionRepo.deleteExpired();
    const tokenHash = this.hashSessionToken(token);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);
    if (!session) {
      return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionRepo.deleteByTokenHash(tokenHash);
      return null;
    }
    return session;
  }

  private hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
