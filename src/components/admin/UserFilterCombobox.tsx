"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserSearch, X, Loader2 } from "lucide-react";

type UserOption = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
};

export default function UserFilterCombobox({
    selectedUserId,
    selectedUserLabel,
    query,
    status,
}: {
    selectedUserId?: string;
    selectedUserLabel?: string;
    query?: string;
    status?: string;
}) {
    const router = useRouter();
    const [inputValue, setInputValue] = useState("");
    const [results, setResults] = useState<UserOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (inputValue.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/admin/users/search?q=${encodeURIComponent(inputValue)}`
                );
                const data = await res.json();
                setResults(Array.isArray(data) ? data : []);
                setOpen(true);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, [inputValue]);

    function buildUrl(userId: string) {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (status) params.set("status", status);
        params.set("userId", userId);
        return `/admin/events?${params.toString()}`;
    }

    function clearFilter() {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (status) params.set("status", status);
        const qs = params.toString();
        router.push(`/admin/events${qs ? `?${qs}` : ""}`);
    }

    function selectUser(user: UserOption) {
        setOpen(false);
        setInputValue("");
        router.push(buildUrl(user.id));
    }

    // If a user is already selected, show a badge instead of the input
    if (selectedUserId && selectedUserLabel) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border-2 border-violet-500/40 rounded-lg text-sm text-violet-300 whitespace-nowrap">
                <UserSearch className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate max-w-[160px]" title={selectedUserLabel}>
                    {selectedUserLabel}
                </span>
                <button
                    onClick={clearFilter}
                    className="ml-1 hover:text-white transition-colors shrink-0"
                    title="Quitar filtro"
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative flex-1 md:flex-none">
            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
            {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5 animate-spin" />
            )}
            <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => results.length > 0 && setOpen(true)}
                placeholder="Filtrar por usuario..."
                className="bg-neutral-900 border-2 border-white/10 rounded-lg py-2 pl-10 pr-8 text-sm text-white focus:border-violet-500 outline-none w-full md:w-52 transition-all focus:w-64"
            />

            {open && results.length > 0 && (
                <ul className="absolute top-full left-0 mt-1.5 w-72 bg-neutral-900 border-2 border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {results.map((user) => (
                        <li key={user.id}>
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault(); // prevent input blur before click
                                    selectUser(user);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                            >
                                <div className="w-7 h-7 rounded-full bg-gray-800 overflow-hidden shrink-0">
                                    {user.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase">
                                            {(user.name || user.email || "?")[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm text-white font-medium truncate">
                                        {user.name || "Sin nombre"}
                                    </div>
                                    <div className="text-[11px] text-gray-500 truncate">
                                        {user.email}
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
