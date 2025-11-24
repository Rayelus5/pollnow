import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed: creando únicamente usuario admin...');

    // 1. Limpiar toda la base de datos (Ordenado por dependencias para evitar errores de FK)
    // Borramos primero los hijos (tablas que tienen FKs), luego los padres
    
    // Modelos de Soporte y Chat (Nuevos nombres)
    await prisma.chatMessage.deleteMany(); // Antes TicketMessage
    await prisma.supportChat.deleteMany(); // Antes SupportTicket
    await prisma.notification.deleteMany();
    
    // Modelos de Votación
    await prisma.voteOption.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.option.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.participant.deleteMany();
    
    // Modelos Principales
    await prisma.event.deleteMany();
    
    // Modelos de Auth
    await prisma.verificationToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    
    // Usuario final
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
            subscriptionStatus: 'active', // Admin suele tener privilegios premium
            stripePriceId: 'price_dummy_admin', // Placeholder
            image: null,
            role: UserRole.ADMIN, // <--- IMPORTANTE: Asignamos el rol de ADMIN
            ipBan: false
        }
    });

    console.log('👤 Usuario administrador creado:', admin.email, '| Rol:', admin.role);
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