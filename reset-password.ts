import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@foty.com'; // Tu email de admin
    const newPassword = '123456';

    console.log(`🔄 Reseteando contraseña para ${email}...`);

    // 1. Encriptar con las mismas opciones que usa tu app
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 2. Actualizar en DB
    await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword }
    });

    console.log(`✅ Contraseña actualizada a: ${newPassword}`);

    // 3. Verificar inmediatamente (Prueba de fuego)
    const user = await prisma.user.findUnique({ where: { email } });
    const isValid = await bcrypt.compare(newPassword, user?.passwordHash || "");

    if (isValid) {
        console.log("🔓 Verificación exitosa: El hash funciona correctamente.");
    } else {
        console.error("❌ Error crítico: El hash no coincide inmediatamente después de guardarlo.");
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
