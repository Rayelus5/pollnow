"use client";

import { useState, useCallback } from "react";
import Image, { type ImageProps } from "next/image";
import { clsx } from "clsx";
import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";

type Props = Omit<ImageProps, "fill" | "alt" | "src"> & {
    src: string;
    alt?: string;
    skeletonClassName?: string;
};

/**
 * Imagen optimizada (next/image, `fill`) con animación de carga: muestra un
 * skeleton con spinner Ring mientras la imagen no ha cargado, luego hace
 * fade-in. Si falla, muestra un placeholder de imagen rota. Maneja
 * correctamente imágenes cacheadas comprobando img.complete en el montaje.
 *
 * IMPORTANTE: debe usarse dentro de un contenedor posicionado y con tamaño
 * (`relative` + alto explícito o `aspect-*`), ya que tanto el skeleton como
 * la imagen (`fill`) se renderizan con `absolute inset-0`.
 *
 * Las imágenes legacy guardadas como data-URI (nominados creados antes de
 * migrar a Vercel Blob) se sirven con `unoptimized`, ya que next/image no
 * admite data-URLs en su optimizador.
 */
export default function ImageWithSkeleton({
    className,
    skeletonClassName,
    onLoad,
    onError,
    alt = "",
    sizes = "(min-width: 768px) 25vw, 45vw",
    src,
    unoptimized,
    ...rest
}: Props) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Maneja imágenes cacheadas: el evento load puede dispararse antes de que
    // React adjunte el handler, así que comprobamos img.complete en el montaje.
    const imgRef = useCallback((img: HTMLImageElement | null) => {
        if (img?.complete && img.naturalWidth > 0) setLoaded(true);
    }, []);

    const isDataUrl = typeof src === "string" && src.startsWith("data:");

    return (
        <>
            {!loaded && !error && (
                <div
                    aria-hidden
                    className={clsx(
                        "absolute inset-0 bg-neutral-800 flex items-center justify-center",
                        skeletonClassName,
                    )}
                >
                    <Ring size="32" stroke="3" color="white" speed="2" />
                </div>
            )}

            {error && (
                <div
                    aria-hidden
                    className="absolute inset-0 bg-neutral-800 flex items-center justify-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-8 text-neutral-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0 1 21 4.5v15M3 3l18 18"
                        />
                    </svg>
                </div>
            )}

            <Image
                {...rest}
                ref={imgRef}
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                unoptimized={unoptimized ?? isDataUrl}
                className={clsx(
                    className,
                    "transition-opacity duration-500",
                    loaded && !error ? "opacity-100" : "opacity-0",
                )}
                onLoad={(e) => {
                    setLoaded(true);
                    onLoad?.(e);
                }}
                onError={(e) => {
                    setLoaded(true);
                    setError(true);
                    onError?.(e);
                }}
            />
        </>
    );
}
