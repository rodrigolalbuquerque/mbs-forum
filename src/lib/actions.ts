"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createPost(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return;

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("posts")
    .insert({ title, body, author_id: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect(`/posts/${data.id}`);
}

// Anexos: tipos e limite permitidos (validados também no cliente).
const ALLOWED_FILE_EXT = ["pdf", "doc", "docx", "md", "txt"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function addComment(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const filePath = String(formData.get("file_path") ?? "").trim() || null;
  const fileName = String(formData.get("file_name") ?? "").trim() || null;
  const fileType = String(formData.get("file_type") ?? "").trim() || null;
  const fileSize = Number(formData.get("file_size") ?? 0);
  if (!postId) return;
  if (!body && !filePath) return;

  const { supabase, user } = await requireUser();

  if (filePath) {
    const ext = (fileName?.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_FILE_EXT.includes(ext))
      throw new Error("Tipo de arquivo não permitido.");
    if (fileSize > MAX_FILE_BYTES) throw new Error("Arquivo acima de 10 MB.");
    if (!filePath.startsWith(`${user.id}/`))
      throw new Error("Caminho de arquivo inválido.");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body,
    file_path: filePath,
    file_name: fileName,
    file_type: fileType,
    file_size: filePath ? fileSize : null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/posts/${postId}`);
}

// Gera uma URL assinada (curta) para baixar/abrir um anexo. A RLS do Storage
// garante que só usuários aprovados conseguem assinar.
export async function signAttachment(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("chat-files")
    .createSignedUrl(path, 60);
  return data?.signedUrl ?? null;
}

export async function setStatus(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!postId || !["aberto", "concluido"].includes(status)) return;

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("posts")
    .update({
      status,
      status_changed_by: user.id,
      status_changed_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

export async function deletePost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function deleteComment(formData: FormData) {
  const commentId = String(formData.get("comment_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  if (!commentId) return;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/posts/${postId}`);
}

// ---- Edição (só o autor) ----

async function assertPostAuthor(postId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();
  if (!data || data.author_id !== user.id) {
    throw new Error("Sem permissão para editar este tópico.");
  }
  return { supabase, user };
}

export async function updatePostTitle(postId: string, title: string) {
  const clean = title.trim();
  if (!postId || !clean) return;
  const { supabase } = await assertPostAuthor(postId);
  const { error } = await supabase
    .from("posts")
    .update({ title: clean })
    .eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

export async function updatePostBody(postId: string, body: string) {
  if (!postId) return;
  const { supabase } = await assertPostAuthor(postId);
  const { error } = await supabase
    .from("posts")
    .update({ body: body.trim() })
    .eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

export async function updateComment(
  commentId: string,
  body: string,
  postId: string,
) {
  const clean = body.trim();
  if (!commentId || !clean) return;
  // A RLS (comments_update_own) garante que só o autor atualiza.
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("comments")
    .update({ body: clean })
    .eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/posts/${postId}`);
}

export async function deleteCommentById(commentId: string, postId: string) {
  if (!commentId) return;
  const { supabase } = await requireUser();

  // Pega o anexo (se houver) para remover do Storage.
  const { data: c } = await supabase
    .from("comments")
    .select("file_path")
    .eq("id", commentId)
    .single();

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (error) throw new Error(error.message);

  if (c?.file_path) {
    await supabase.storage.from("chat-files").remove([c.file_path]);
  }
  revalidatePath(`/posts/${postId}`);
}

export async function deletePostById(postId: string) {
  if (!postId) return;
  const { supabase } = await assertPostAuthor(postId);

  // Remove os anexos dos comentários do tópico (evita órfãos no Storage).
  const { data: files } = await supabase
    .from("comments")
    .select("file_path")
    .eq("post_id", postId)
    .not("file_path", "is", null);
  const paths = (files ?? [])
    .map((f) => f.file_path)
    .filter((p): p is string => !!p);

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  if (paths.length) await supabase.storage.from("chat-files").remove(paths);
  revalidatePath("/");
  redirect("/");
}

// Aprovar/revogar um usuário (a RPC no banco exige que o autor seja admin).
export async function setApproval(userId: string, approve: boolean) {
  if (!userId) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("set_user_approval", {
    target_id: userId,
    approve,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// Marca o tópico como lido pelo usuário atual (para o badge de não-lidas).
// Usa RPC para gravar o now() do banco (evita desvio de relógio).
export async function markTopicRead(postId: string) {
  if (!postId) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_topic_read", { p_id: postId });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
