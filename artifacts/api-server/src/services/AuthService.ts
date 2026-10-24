import { UserModel } from "../models/UserModel";

export class AuthService {
  static async register(data: {
    name: string;
    phone: string;
    email?: string | null;
    cpf?: string | null;
    gender?: string | null;
    passwordHash?: string | null;
  }) {
    if (data.gender === "Homem") {
      const err = new Error("GENDER_RESTRICTED");
      (err as Error & { code: string }).code = "GENDER_RESTRICTED";
      throw err;
    }

    return UserModel.create({
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      cpf: data.cpf ?? null,
      gender: data.gender ?? null,
      passwordHash: data.passwordHash ?? null,
      onboardingCompleted: false,
    });
  }

  static async recoverAccount(email: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) return null;

    const token = Math.random().toString(36).substring(2, 18).toUpperCase();

    return {
      userId: user.id,
      email: user.email,
      token,
      message: `Token de recuperação gerado. Em produção, seria enviado para ${user.email}.`,
    };
  }

  static async hashPassword(plain: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain + "sos_mulher_salt");
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Buffer.from(hash).toString("hex");
  }

  static async verifyPassword(plain: string, hash: string): Promise<boolean> {
    const computed = await AuthService.hashPassword(plain);
    return computed === hash;
  }
}
