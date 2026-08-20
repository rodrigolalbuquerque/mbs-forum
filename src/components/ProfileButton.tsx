"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resizeImageToSquare } from "@/lib/image";
import Avatar from "@/components/Avatar";

export default function ProfileButton({
  userId,
  username,
  displayName,
  avatarUrl,
}: {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(displayName);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Carrega o supabase-js só na hora de salvar (fora do bundle inicial).
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      let newAvatarUrl = avatarUrl;

      if (file) {
        // Reduz para ~256px antes de subir (bem mais leve p/ carregar depois).
        const blob = await resizeImageToSquare(file, 256, 0.85);
        const path = `${userId}/avatar`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, {
            upsert: true,
            contentType: blob.type || "image/webp",
            cacheControl: "31536000",
          });
        if (upErr) throw upErr;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        newAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || username,
          avatar_url: newAvatarUrl,
        })
        .eq("id", userId);
      if (updErr) throw updErr;

      setOpen(false);
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Editar perfil"
        className="flex items-center gap-3 overflow-hidden rounded-full pr-2 transition hover:bg-black/5"
      >
        <Avatar name={displayName} src={avatarUrl} size={40} />
        <span className="truncate text-sm font-medium text-[#111b21]">
          {displayName}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#111b21]">
              Editar perfil
            </h2>

            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative"
                title="Trocar foto"
              >
                <Avatar name={name || username} src={preview} size={96} />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                  Trocar
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={pickFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm text-wa-green-dark hover:underline"
              >
                Escolher foto
              </button>
            </div>

            <label className="mt-5 block text-sm font-medium text-[#111b21]">
              Nome de exibição
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="mt-1 w-full rounded-lg border border-wa-panelborder px-3 py-2.5 text-sm outline-none focus:border-wa-green"
            />
            <p className="mt-1 text-xs text-wa-secondary">
              Usuário de login: <strong>@{username}</strong> (não muda)
            </p>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-full px-4 py-2 text-sm text-wa-secondary hover:bg-black/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-wa-green px-5 py-2 text-sm font-medium text-white transition hover:bg-wa-green-dark disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
