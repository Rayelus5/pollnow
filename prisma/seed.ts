import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Seed para arquitectura SaaS...');

    // 1. Limpiar DB (Orden inverso a las dependencias para evitar errores de FK)
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

    // 2. Crear USUARIO ADMIN (El dueño del evento)
    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@foty.com',
            username: 'admin',
            passwordHash: hashedPassword,
            subscriptionStatus: 'active', // Simulamos que es Premium
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
        }
    });

    console.log('👤 Usuario creado:', adminUser.email);

    // 3. Crear EVENTO (FOTY 2025)
    // Ahora todo cuelga de aquí
    const event = await prisma.event.create({
        data: {
            title: 'FOTY 2025',
            slug: 'foty-2025',
            description: 'Premios a la amistad y las leyendas.',
            isPublic: true,
            galaDate: new Date('2025-12-31T23:59:59'),
            userId: adminUser.id, // Vinculado al usuario
            tags: ['amigos', 'premios', 'risas']
        }
    });

    console.log('📅 Evento creado:', event.title);

    // 4. Crear PARTICIPANTES (Vinculados al Evento)
    const p1 = await prisma.participant.create({
        data: { name: 'Alejandro', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alejandro', eventId: event.id }
    });
    const p2 = await prisma.participant.create({
        data: { name: 'Sofía', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia', eventId: event.id }
    });
    const p3 = await prisma.participant.create({
        data: { name: 'Carlos', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', eventId: event.id }
    });
    const p4 = await prisma.participant.create({
        data: { name: 'Lucía', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia', eventId: event.id }
    });

    console.log('👥 Participantes creados');

    // 5. Crear ENCUESTAS (Vinculadas al Evento)

    // Poll 1
    await prisma.poll.create({
        data: {
            title: 'Categoría: El Reloj Roto',
            description: 'Premio al amigo que nunca llega a su hora.',
            votingType: 'SINGLE',
            order: 1,
            eventId: event.id, // <--- IMPORTANTE
            options: {
                create: [
                    { participantId: p1.id, subtitle: 'Siempre dice "estoy llegando"' },
                    { participantId: p2.id, subtitle: 'Vive en otro huso horario' },
                    { participantId: p3.id },
                ]
            }
        }
    });

    // Poll 2
    await prisma.poll.create({
        data: {
            title: 'Categoría: Animal Nocturno',
            description: '¿Quién cierra siempre el bar?',
            votingType: 'SINGLE',
            order: 2,
            eventId: event.id, // <--- IMPORTANTE
            options: {
                create: [
                    { participantId: p2.id },
                    { participantId: p3.id },
                    { participantId: p4.id },
                ]
            }
        }
    });

    console.log('🗳️ Encuestas creadas');
    console.log('🚀 Seed completado con éxito');
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