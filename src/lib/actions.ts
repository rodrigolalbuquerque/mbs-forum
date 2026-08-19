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

export async function addComment(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!postId || !body) return;

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body });

  if (error) throw new Error(error.message);
  revalidatePath(`/posts/${postId}`);
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
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/posts/${postId}`);
}

export async function deletePostById(postId: string) {
  if (!postId) return;
  const { supabase } = await assertPostAuthor(postId);
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
