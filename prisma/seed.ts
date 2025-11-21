import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed: creando únicamente usuario admin...');

    // 1. Limpiar toda la base de datos
    await prisma.voteOption.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.option.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.event.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Base de datos limpiada');

    // 2. Crear usuario ADMIN único
    const hashedPassword = await bcrypt.hash('101815', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Administrador',
            email: 'admin@admin.com',
            username: 'admin',
            passwordHash: hashedPassword,
            subscriptionStatus: 'free', // por defecto, sin suscripción
            image: null
        }
    });

    console.log('👤 Usuario administrador creado:', admin.email);
    console.log('🚀 Seed completado correctamente');
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
