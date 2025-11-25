"use client";

import { useState } from "react";
import { toggleUserBan, changeUserRole, deleteUser } from "@/app/lib/admin-actions"; // Necesitaremos crear estas acciones
import { ShieldAlert, UserCog, Trash2, Check, Shield } from "lucide-react";
import { Bouncy } from 'ldrs/react';
import { useRouter } from "next/navigation";

if (typeof window !== 'undefined') import('ldrs/bouncy');

type User = {
    id: string;
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    ipBan: boolean;
    name: string | null;
};

export default function UserActions({ user }: { user: User }) {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(user.role);
    const router = useRouter();

    const handleBanToggle = async () => {
        if (!confirm(user.ipBan ? "¿Desbloquear usuario?" : "¿Banear usuario permanentemente?")) return;
        setLoading(true);
        await toggleUserBan(user.id);
        setLoading(false);
        router.refresh();
    };

    const handleRoleChange = async (newRole: 'USER' | 'ADMIN' | 'MODERATOR') => {
        if (!confirm(`¿Cambiar rol de ${user.name} a ${newRole}?`)) return;
        setLoading(true);
        await changeUserRole(user.id, newRole);
        setRole(newRole);
        setLoading(false);
        router.refresh();
    };

    const handleDelete = async () => {
        const confirmText = prompt(`Escribe "BORRAR" para eliminar permanentemente a ${user.name} y todos sus datos.`);
        if (confirmText !== "BORRAR") return;
        
        setLoading(true);
        await deleteUser(user.id);
        router.push('/admin/users');
    };

    return (
        <div className="space-y-6">
            
            {/* Cambio de Rol */}
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={16} /> Permisos y Roles
                </h3>
                <div className="flex gap-2">
                    {(['USER', 'MODERATOR', 'ADMIN'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => handleRoleChange(r)}
                            disabled={loading || role === r}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                role === r 
                                ? 'bg-blue-600 border-blue-500 text-white cursor-default' 
                                : 'bg-black border-white/10 text-gray-500 hover:text-white hover:border-white/30'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zona de Peligro */}
            <div className="bg-red-950/10 border border-red-500/20 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} /> Zona de Riesgo
                </h3>
                
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                    <div>
                        <p className="text-white text-sm font-bold">Banear Usuario</p>
                        <p className="text-xs text-gray-500">Impide el acceso a la plataforma.</p>
                    </div>
                    <button 
                        onClick={handleBanToggle}
                        disabled={loading}
                        className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${
                            user.ipBan 
                            ? 'bg-green-600 text-white hover:bg-green-500' 
                            : 'bg-red-600 text-white hover:bg-red-500'
                        }`}
                    >
                        {user.ipBan ? "Desbloquear" : "Banear"}
                    </button>
                </div>

                <button 
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full py-3 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 size={14} /> Eliminar Cuenta Completamente
                </button>
            </div>

        </div>
    );
}