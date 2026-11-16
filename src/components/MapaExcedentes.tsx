"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { CATEGORIA_MAP, CANTIDAD_MAP, CENTRO_SANTA_CRUZ } from "@/lib/constants";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";

export interface MapaPublicacionPoint {
  id: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  mercado: string;
  direccionTexto: string;
  lat: number;
  lng: number;
  ventanaFin: string;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

export default function MapaExcedentes({
  publicaciones,
  onSelect,
}: {
  publicaciones: MapaPublicacionPoint[];
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [CENTRO_SANTA_CRUZ.lat, CENTRO_SANTA_CRUZ.lng],
      zoom: 13,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layerRef.current;
    const map = mapRef.current;
    if (!group || !map) return;

    group.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    for (const pub of publicaciones) {
      const cat = CATEGORIA_MAP[pub.categoria];
      const cant = CANTIDAD_MAP[pub.cantidadAproximada];
      const horaFin = new Date(pub.ventanaFin).toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const icon = L.divIcon({
        className: "kilocero-map-pin",
        html: `<div style="display:flex;align-items:center;gap:4px;background:#065f46;color:#fff;border:2px solid #020617;border-radius:9999px;padding:4px 10px;font-weight:800;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.35);white-space:nowrap;"><span>${cat.emoji}</span><span>${cant.label}</span></div>`,
        iconSize: [90, 34],
        iconAnchor: [45, 17],
      });

      const marker = L.marker([pub.lat, pub.lng], { icon });
      const popupEl = document.createElement("div");
      popupEl.style.minWidth = "190px";
      popupEl.innerHTML = `
        <p style="margin:0;font-weight:800;font-size:14px;color:#020617;">${cat.emoji} ${cat.label} · ${cant.label}</p>
        <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#0f172a;">${esc(pub.mercado)}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#334155;">${esc(pub.direccionTexto)}</p>
        <p style="margin:4px 0 8px;font-size:12px;font-weight:700;color:#065f46;">Hasta las ${horaFin}</p>
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Ver y reservar";
      btn.style.cssText =
        "width:100%;min-height:40px;background:#065f46;color:#fff;border:none;border-radius:8px;font-weight:800;font-size:13px;cursor:pointer;";
      btn.onclick = () => {
        if (onSelect) onSelect(pub.id);
      };
      popupEl.appendChild(btn);

      marker.bindPopup(popupEl);
      marker.addTo(group);
      bounds.push([pub.lat, pub.lng]);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    }
  }, [publicaciones, onSelect]);

  return (
    <div
      ref={containerRef}
      aria-label="Mapa de excedentes en Santa Cruz de la Sierra"
      className="h-[380px] w-full rounded-2xl border-2 border-slate-900 bg-slate-200 z-0"
    />
  );
}
