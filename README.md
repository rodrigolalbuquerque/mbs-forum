# MBS Fórum

App simples para o grupo levantar debates, comentar e marcar cada questão como
**Aberto** ou **Concluído** — cada um contribui no seu tempo, sem discussões se
perderem como no WhatsApp.

Stack: **Next.js + Supabase + Vercel**. Instalável como app no celular/desktop (PWA).

---

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie um projeto (plano grátis serve).
2. Vá em **SQL Editor**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Em **Authentication > Providers > Email**, deixe habilitado.
   - Para simplificar (sem etapa de confirmar e-mail), desligue **"Confirm email"**.
     Assim a pessoa cadastra e já entra.
4. Libere quem pode entrar. No **SQL Editor**, rode (um por integrante):
   ```sql
   insert into public.allowed_emails (email) values ('pessoa@exemplo.com');
   ```
   Quem não estiver nessa lista **não consegue** se cadastrar.

## 2. Conectar o app ao Supabase

Em **Project Settings > API**, copie a **Project URL** e a **anon public key**
e cole em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## 4. Publicar na Vercel

1. Suba o código para um repositório no GitHub.
2. Em https://vercel.com, clique em **Add New > Project** e importe o repositório.
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (os mesmos valores do `.env.local`).
4. **Deploy**. Você recebe uma URL tipo `https://seu-app.vercel.app`.

## 5. Instalar como app (PWA)

Cada integrante abre a URL e:

- **Android/Chrome:** menu ⋮ > *Instalar app* / *Adicionar à tela inicial*.
- **iPhone/Safari:** botão Compartilhar > *Adicionar à Tela de Início*.
- **Desktop:** ícone de instalar na barra de endereço.

Vira um ícone que abre como aplicativo, em tela cheia.

---

### Trocar o logo / regerar os ícones (opcional)

O logo fica em `public/logo.png`. Para regerar os ícones do PWA e o favicon
a partir dele:

```bash
node scripts/make-logo-icons.mjs
```
