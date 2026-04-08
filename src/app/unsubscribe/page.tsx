import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import Link from "next/link";
import { BellOff, CheckCircle2, XCircle } from "lucide-react";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

const LABELS: Record<string, string> = {
  notifications: "correos de notificaciones del sistema",
  collaborations: "correos de invitaciones de colaboración",
};

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <Result ok={false} message="Enlace no válido o expirado." />;
  }

  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
    return <Result ok={false} message="El enlace no es válido. Puede que ya hayas usado este enlace o que haya caducado." />;
  }

  const { userId, type } = payload;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailNotifications: type === "notifications" ? false : undefined,
        emailCollaborations: type === "collaborations" ? false : undefined,
      },
    });
  } catch {
    return <Result ok={false} message="No se pudo procesar la solicitud. Inténtalo de nuevo desde tu perfil." />;
  }

  return (
    <Result
      ok={true}
      message={`Te has dado de baja de los ${LABELS[type] ?? type}. Puedes volver a activarlos en cualquier momento desde tu perfil.`}
    />
  );
}

function Result({ ok, message }: { ok: boolean; message: string }) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            ok
              ? "bg-green-500/10 border-2 border-green-500/20"
              : "bg-red-500/10 border-2 border-red-500/20"
          }`}
        >
          {ok ? (
            <CheckCircle2 className="w-7 h-7 text-green-400" />
          ) : (
            <XCircle className="w-7 h-7 text-red-400" />
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <BellOff className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Preferencias de correo
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {ok ? "Baja confirmada" : "Algo salió mal"}
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard?tab=profile"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/8 hover:bg-white/12 border-2 border-white/10 text-sm font-semibold text-white transition-all"
          >
            Gestionar preferencias
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
