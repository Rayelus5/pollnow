import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export const generateVerificationToken = async (email: string) => {
    const token = uuidv4();
    // El token expira en 1 hora
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    // 1. Si ya existe un token viejo para este email, lo borramos
    const existingToken = await prisma.verificationToken.findFirst({
        where: { email }
    });

    if (existingToken) {
        await prisma.verificationToken.delete({
            where: { id: existingToken.id }
        });
    }

    // 2. Creamos el nuevo token
    const verificationToken = await prisma.verificationToken.create({
        data: {
            email,
            token,
            expires,
        }
    });

    return verificationToken;
};