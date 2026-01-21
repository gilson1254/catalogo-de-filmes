# 🚀 Guia de Início Rápido - Versão Windows

## ✨ Esta versão funciona perfeitamente no Windows!

**Sem erros de compilação!** Não precisa de Python, Visual Studio ou outras ferramentas.

---

## 📦 Instalação Rápida

### 1️⃣ Instalar Node.js (se não tiver)

Baixe e instale: https://nodejs.org/
- Escolha a versão LTS (recomendada)
- Durante a instalação, marque todas as opções

### 2️⃣ Extrair o Projeto

Extraia o arquivo ZIP em uma pasta (ex: `C:\Users\SeuNome\movie-list`)

### 3️⃣ Instalar Dependências

Abra o **PowerShell** ou **Prompt de Comando** na pasta do projeto e execute:

```bash
npm install
```

**Pronto!** Deve instalar sem erros em segundos.

---

## 🔑 Configurar API Key

Sua API Key já está configurada no arquivo `.env`:
```
TMDB_API_KEY=241fc0dedb7f868c12d16d6c43eb4dbc
```

---

## ▶️ Executar

```bash
npm start
```

Abra no navegador: **http://localhost:3000**

---

## 🎬 Usar a Aplicação

1. **Criar conta** → Escolha usuário e senha
2. **Fazer login** → Entre com suas credenciais
3. **Buscar filmes** → Digite o nome ou veja populares
4. **Marcar filmes** → Assistido ou Quero Ver
5. **Ver listas** → Suas listas e lista compartilhada

---

## 📤 Enviar para o GitHub

```bash
git init
git add .
git commit -m "Primeira versão"
git remote add origin https://github.com/gilson1254/catalogo-de-filmes.git
git push -u origin main
```

Quando pedir credenciais:
- **Username**: gilson1254
- **Password**: [seu token do GitHub]

---

## 💡 Diferenças desta Versão

| Antes | Agora |
|-------|-------|
| ❌ Erro de compilação | ✅ Instala sem erros |
| ❌ Precisa Python | ✅ Só precisa Node.js |
| ❌ Precisa Visual Studio | ✅ Sem ferramentas extras |
| SQLite (binário) | JSON (arquivo texto) |

---

## 🆘 Problemas?

**Porta 3000 ocupada?**
```bash
# Use outra porta
set PORT=3001
npm start
```

**Não acha o Node.js?**
- Feche e abra o terminal novamente
- Ou reinicie o computador após instalar o Node.js

---

**Tudo pronto! Aproveite! 🎉**
