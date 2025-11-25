'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/plans";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Esquema de validación
const eventSchema = z.object({
  title: z.string()
    .min(3, "El título es muy corto")
    .regex(/^[\w\s\-\.,:;!¡?¿()áéíóúÁÉÍÓÚñÑüÜ]+$/, "El título contiene caracteres no permitidos."),
  description: z.string().optional(),
});

// --- CREAR EVENTO ---
export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { events: true } } }
  });

  if (!user) return { error: "Usuario no encontrado" };

  const plan = getPlanFromUser(user);
  const currentEvents = user._count.events;

  if (currentEvents >= plan.quota) {
    return { 
        error: `Has alcanzado el límite de tu plan ${plan.name}. Actualiza a Premium.` 
    };
  }

  const titleRaw = formData.get('title') as string;
  const descRaw = formData.get('description') as string;
  const tagsRaw = formData.get('tags') as string;

  const validated = eventSchema.safeParse({ title: titleRaw, description: descRaw });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { title, description } = validated.data;

  const slug = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Math.floor(Math.random() * 10000);

  const defaultGalaDate = new Date();
  defaultGalaDate.setDate(defaultGalaDate.getDate() + 2);

  try {
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [],
        slug,
        userId: session.user.id,
        isPublic: false,
        status: 'DRAFT',
        galaDate: defaultGalaDate,
      }
    });
    
    return { success: true, eventId: newEvent.id };
  } catch (error) {
    console.error(error);
    return { error: "Error al crear evento" };
  }
}

// --- ACTUALIZAR EVENTO ---
export async function updateEvent(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const galaDateStr = formData.get('galaDate') as string;
  
  // Nota: isPublic ya no se puede cambiar directamente si el evento no está APROBADO
  // Pero mantenemos la lógica para cuando sea aprobado o para guardar la intención
  const isPublicInput = formData.get('isPublic') === 'on';
  const isAnonymousVoting = formData.get('isAnonymousVoting') === 'on';

  let galaDate: Date | null = null;
  if (galaDateStr && galaDateStr !== "") {
     const parsedDate = new Date(galaDateStr);
     if (!isNaN(parsedDate.getTime())) {
        galaDate = parsedDate;
     }
  }

  // Recuperamos el evento actual para saber si podemos cambiar isPublic
  const currentEvent = await prisma.event.findUnique({ where: { id: eventId } });
  
  let newIsPublic = false;
  // Solo permitimos isPublic=true si el estado es APPROVED
  if (currentEvent?.status === 'APPROVED') {
      newIsPublic = isPublicInput;
  }

  await prisma.event.update({
    where: { id: eventId, userId: session.user.id },
    data: {
      title,
      description,
      galaDate,
      isPublic: newIsPublic,
      isAnonymousVoting
    }
  });

  revalidatePath(`/dashboard/event/${eventId}`);
  if (newIsPublic) revalidatePath('/polls');
}

// --- BORRAR EVENTO ---
export async function deleteEvent(eventId: string) {
    const session = await auth();
    if (!session?.user) return;
    await prisma.event.delete({ where: { id: eventId, userId: session.user.id } });
    revalidatePath('/dashboard');
    redirect('/dashboard');
}

// --- ROTAR CLAVE PRIVADA ---
export async function rotateEventKey(eventId: string) {
    const session = await auth();
    if (!session?.user) return;
    await prisma.event.update({
      where: { id: eventId, userId: session.user.id },
      data: { accessKey: crypto.randomUUID() }
    });
    revalidatePath(`/dashboard/event/${eventId}`);
}

// --- SOLICITAR PUBLICACIÓN (NUEVO) ---
export async function requestEventPublication(eventId: string) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    const event = await prisma.event.findUnique({
        where: { id: eventId, userId: session.user.id },
    });

    if (!event) return { error: "Evento no encontrado" };

    if (event.status === "PENDING") return { error: "Ya está en revisión." };
    if (event.status === "APPROVED") return { error: "El evento ya es público." };

    if (event.status !== "DRAFT" && event.status !== "DENIED") {
        return { error: "Estado de evento no válido para solicitud." };
    }

    const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
            status: "PENDING",
            reviewReason: null,
        },
        select: {
            id: true,
            status: true,
            reviewReason: true,
        },
    });

    // Esto está bien aquí, es servidor:
    revalidatePath(`/dashboard/event/${eventId}`);
    revalidatePath("/dashboard/requests");

    return { success: true, event: updated };
}
