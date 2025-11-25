"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/plans";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Esquema de validación
const eventSchema = z.object({
  title: z
    .string()
    .min(3, "El título es muy corto")
    .regex(
      /^[\w\s\-\.,:;!¡?¿()áéíóúÁÉÍÓÚñÑüÜ]+$/,
      "El título contiene caracteres no permitidos."
    ),
  description: z.string().optional(),
});

// --- CREAR EVENTO ---
export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { events: true } } },
  });

  if (!user) return { error: "Usuario no encontrado" };

  const plan = getPlanFromUser(user);
  const currentEvents = user._count.events;

  if (currentEvents >= plan.quota) {
    return {
      error: `Has alcanzado el límite de tu plan ${plan.name}. Actualiza a Premium.`,
    };
  }

  const titleRaw = formData.get("title") as string;
  const descRaw = formData.get("description") as string;
  const tagsRaw = formData.get("tags") as string;

  const validated = eventSchema.safeParse({
    title: titleRaw,
    description: descRaw,
  });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { title, description } = validated.data;

  const slug =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Math.floor(Math.random() * 10000);

  const defaultGalaDate = new Date();
  defaultGalaDate.setDate(defaultGalaDate.getDate() + 2);

  try {
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : [],
        slug,
        userId: session.user.id,
        isPublic: false,
        status: "DRAFT",
        galaDate: defaultGalaDate,
      },
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

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  // 1) Buscar evento según permisos
  const event = await prisma.event.findFirst({
    where: isAdmin
      ? { id: eventId }
      : {
          id: eventId,
          userId: session.user.id,
        },
    select: { id: true, status: true },
  });

  if (!event) {
    console.warn("Intento de actualizar evento sin permisos o inexistente", {
      eventId,
      userId: session.user.id,
      role: session.user.role,
    });
    return;
  }

  // 2) Leer datos del formulario
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const galaDateStr = formData.get("galaDate") as string;

  const isPublicInput = formData.get("isPublic") === "on";
  const isAnonymousVoting = formData.get("isAnonymousVoting") === "on";

  let galaDate: Date | null = null;
  if (galaDateStr && galaDateStr !== "") {
    const parsedDate = new Date(galaDateStr);
    if (!isNaN(parsedDate.getTime())) {
      galaDate = parsedDate;
    }
  }

  // 3) Lógica de isPublic: sólo puede ser true si el evento está APPROVED
  let newIsPublic = false;
  if (event.status === "APPROVED") {
    newIsPublic = isPublicInput;
  }

  // 4) Actualizar evento (ya sabemos que existe y tenemos permisos)
  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      galaDate,
      isPublic: newIsPublic,
      isAnonymousVoting,
    },
  });

  // 5) Revalidar rutas
  revalidatePath(`/dashboard/event/${eventId}`);
  if (newIsPublic) revalidatePath("/polls");
  if (isAdmin) {
    // Por si tienes un listado de eventos para admins
    revalidatePath("/admin/events");
  }
}

// --- BORRAR EVENTO ---
export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) return;

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  // 1) Buscar evento según permisos
  const event = await prisma.event.findFirst({
    where: isAdmin
      ? { id: eventId } // Admin/Moderador: puede borrar cualquier evento
      : {
          id: eventId,
          userId: session.user.id, // Usuario normal: sólo sus propios eventos
        },
    select: { id: true },
  });

  if (!event) {
    console.warn("Intento de borrar evento no encontrado o sin permisos", {
      eventId,
      userId: session.user.id,
      role: session.user.role,
    });
    return;
  }

  // 2) Borrar dependencias en transacción para no romper FKs
  await prisma.$transaction(async (tx) => {
    await tx.report.deleteMany({
      where: { eventId },
    });

    await tx.moderationLog.deleteMany({
      where: { eventId },
    });

    await tx.event.delete({
      where: { id: eventId },
    });
  });

  // 3) Refrescar UI según contexto
  if (isAdmin) {
    revalidatePath("/admin/events");
    redirect("/admin/events");
  } else {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }
}

// --- ROTAR CLAVE PRIVADA ---
export async function rotateEventKey(eventId: string) {
  const session = await auth();
  if (!session?.user) return;

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  // Verificar permisos
  const event = await prisma.event.findFirst({
    where: isAdmin
      ? { id: eventId }
      : {
          id: eventId,
          userId: session.user.id,
        },
    select: { id: true },
  });

  if (!event) {
    console.warn("Intento de rotar clave sin permisos o evento inexistente", {
      eventId,
      userId: session.user.id,
      role: session.user.role,
    });
    return;
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { accessKey: crypto.randomUUID() },
  });

  revalidatePath(`/dashboard/event/${eventId}`);
  if (isAdmin) {
    revalidatePath("/admin/events");
  }
}

// --- SOLICITAR PUBLICACIÓN (NUEVO) ---
export async function requestEventPublication(eventId: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  // Normalmente el que solicita es el dueño, pero dejamos que admin/mod también puedan
  const event = await prisma.event.findFirst({
    where: isAdmin
      ? { id: eventId }
      : {
          id: eventId,
          userId: session.user.id,
        },
  });

  if (!event) return { error: "Evento no encontrado o sin permisos" };

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

  // Revalidamos la página del evento y, según quién sea, su listado
  revalidatePath(`/dashboard/event/${eventId}`);
  revalidatePath("/dashboard/requests");
  if (isAdmin) {
    revalidatePath("/admin/events");
  }

  return { success: true, event: updated };
}
