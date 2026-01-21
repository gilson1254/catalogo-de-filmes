# 📤 Como Enviar para o GitHub

## ✅ Código Já Está Pronto!

O código já foi preparado e está commitado no Git. Agora você só precisa fazer o **push** para o GitHub.

---

## 🚀 Opção 1: Usando GitHub CLI (Mais Fácil)

Se você tem o GitHub CLI instalado:

```bash
cd movie-list-windows
gh auth login
git push -u origin main
```

---

## 🔑 Opção 2: Usando Token de Acesso Pessoal

### Passo 1: Criar Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome: `Nossos Filmes`
4. Marque o escopo: **`repo`** (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você não verá ele novamente!)

### Passo 2: Fazer Push

```bash
cd movie-list-windows
git push -u origin main
```

Quando pedir:
- **Username**: `gilson1254`
- **Password**: Cole o token que você copiou

---

## 🌐 Opção 3: Usando SSH (Recomendado para Uso Contínuo)

### Configurar SSH (uma vez só):

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu-email@example.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub
```

### Adicionar no GitHub:

1. Acesse: https://github.com/settings/keys
2. Clique em **"New SSH key"**
3. Cole a chave pública
4. Salve

### Mudar remote para SSH:

```bash
cd movie-list-windows
git remote set-url origin git@github.com:gilson1254/catalogo-de-filmes.git
git push -u origin main
```

---

## ✅ Verificar se Funcionou

Depois do push, acesse:
https://github.com/gilson1254/catalogo-de-filmes

Você deve ver todos os arquivos lá!

---

## 👥 Adicionar Sua Namorada como Colaboradora

1. Acesse: https://github.com/gilson1254/catalogo-de-filmes/settings/access
2. Clique em **"Add people"**
3. Digite o username ou email dela no GitHub
4. Selecione **"Write"** (para ela poder fazer alterações)
5. Envie o convite

Ela vai receber um email e poderá aceitar o convite!

---

## 🔒 Manter o Repositório Privado

Para garantir que só vocês dois tenham acesso:

1. Acesse: https://github.com/gilson1254/catalogo-de-filmes/settings
2. Role até o final da página
3. Na seção **"Danger Zone"**, clique em **"Change visibility"**
4. Selecione **"Make private"**
5. Confirme

---

## 📝 Dicas

- **Nunca compartilhe seu token** com ninguém
- **Não faça commit do arquivo `.env`** (ele já está no .gitignore)
- **Faça commits frequentes** quando fizer alterações
- **Use mensagens descritivas** nos commits

---

## 🆘 Problemas Comuns

### "Authentication failed"
→ Token inválido ou expirado. Gere um novo token.

### "Permission denied"
→ Você não tem permissão no repositório. Verifique se é o dono.

### "Remote already exists"
→ Normal! O remote já foi configurado. Só fazer o push.

---

**Qualquer dúvida, consulte a documentação do GitHub!** 📚
