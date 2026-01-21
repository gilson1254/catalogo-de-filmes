# 🎬 Movie List - Gerenciador de Filmes (Versão Windows)

Aplicação web para gerenciar listas de filmes com integração à API do The Movie Database (TMDb). **Versão otimizada para Windows** - sem necessidade de compilação!

## ✨ Diferencial desta Versão

**✅ SEM COMPILAÇÃO NATIVA**
- Não precisa de Python, Visual Studio ou ferramentas de build
- Funciona perfeitamente no Windows sem configurações extras
- Usa banco de dados JSON ao invés de SQLite
- Instalação rápida e simples

## 📋 Funcionalidades

- **Autenticação de Usuário**: Sistema de login e registro para acesso privado
- **Busca de Filmes**: Busque filmes por nome ou navegue pelos mais populares
- **Detalhes Completos**: Veja sinopse, trailer, avaliação, gêneros e duração
- **Listas Personalizadas**: 
  - Marque filmes como "Assistidos"
  - Adicione filmes à lista "Quero Assistir"
- **Lista Compartilhada**: Veja todos os filmes marcados por todos os usuários
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile

## 🚀 Como Usar

### 1. Pré-requisitos

- Node.js (versão 14 ou superior) - [Baixar aqui](https://nodejs.org/)
- Conta no TMDb para obter API Key

### 2. Obter API Key do TMDb

1. Acesse: https://www.themoviedb.org/settings/api
2. Crie uma conta (se não tiver)
3. Solicite uma API Key (é gratuito)
4. Copie sua API Key (v3 auth)

### 3. Instalação

**No Windows:**

1. Extraia o projeto em uma pasta
2. Abra o **PowerShell** ou **Prompt de Comando** na pasta do projeto
3. Execute:

```bash
npm install
```

**Pronto!** A instalação deve funcionar sem erros.

### 4. Configuração

Edite o arquivo `.env` e adicione sua API Key:

```
TMDB_API_KEY=sua_chave_api_aqui
PORT=3000
```

### 5. Executar

```bash
npm start
```

A aplicação estará disponível em: **http://localhost:3000**

## 📱 Como Usar a Aplicação

### Primeiro Acesso

1. Abra http://localhost:3000 no navegador
2. Clique em "Criar conta"
3. Escolha um usuário e senha
4. Faça login com suas credenciais

### Buscar Filmes

1. Na aba "Buscar Filmes":
   - Digite o nome de um filme e clique em "Buscar"
   - Ou clique em "Filmes Populares" para ver os mais populares
2. Clique em "Detalhes" para ver informações completas e trailer
3. Clique em "✓ Assistido" para marcar como assistido
4. Clique em "+ Quero Ver" para adicionar à lista de desejos

### Gerenciar Listas

- **Aba "Assistidos"**: Veja todos os filmes que você marcou como assistidos
- **Aba "Quero Assistir"**: Veja todos os filmes que você quer assistir
- **Aba "Lista Compartilhada"**: Veja os filmes marcados por todos os usuários

## 🔧 Estrutura do Projeto

```
movie-list-windows/
├── server.js           # Servidor backend (Express + JSON)
├── package.json        # Dependências do projeto
├── database.json       # Banco de dados (criado automaticamente)
├── .env               # Configurações (API Key)
├── .env.example       # Exemplo de configurações
├── .gitignore         # Arquivos ignorados pelo Git
├── README.md          # Esta documentação
└── public/            # Frontend
    ├── index.html     # Página principal
    ├── styles.css     # Estilos
    └── app.js         # Lógica do frontend
```

## 💾 Banco de Dados

Esta versão usa **JSON** ao invés de SQLite:
- ✅ Não precisa de compilação
- ✅ Funciona em qualquer sistema operacional
- ✅ Fácil de fazer backup (apenas copie o arquivo `database.json`)
- ✅ Dados armazenados em formato legível

O arquivo `database.json` é criado automaticamente na primeira execução.

## 🐛 Solução de Problemas

### "TMDB_API_KEY não configurada"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme se a API Key está correta no arquivo `.env`

### "Erro ao carregar filmes"
- Verifique sua conexão com a internet
- Confirme se a API Key do TMDb está válida

### Porta 3000 já em uso
- Altere a porta no arquivo `.env`: `PORT=3001`
- Ou encerre o processo que está usando a porta 3000

### Problemas de instalação no Windows
Esta versão foi criada especificamente para **não ter** problemas de instalação no Windows! Se ainda assim tiver problemas:
1. Certifique-se de ter o Node.js instalado
2. Execute `npm install` novamente
3. Se persistir, delete a pasta `node_modules` e execute `npm install` novamente

## 📤 Enviar para o GitHub

```bash
git init
git add .
git commit -m "Primeira versão - Movie List App"
git remote add origin https://github.com/gilson1254/catalogo-de-filmes.git
git push -u origin main
```

**Lembre-se**: Criar o repositório como **PRIVADO** no GitHub!

## 👥 Compartilhar com Outra Pessoa

1. A outra pessoa deve clonar o repositório
2. Criar seu próprio arquivo `.env` com a API Key
3. Executar `npm install` e `npm start`
4. Ambos podem ver a "Lista Compartilhada" se usarem o mesmo arquivo `database.json`

**Dica**: Para compartilhar as listas entre vocês, você pode:
- Usar o mesmo arquivo `database.json` (copiar entre os computadores)
- Ou hospedar a aplicação online (Render, Railway, etc.)

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, Express
- **Banco de Dados**: JSON (arquivo local)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **API**: The Movie Database (TMDb)

## 📝 Diferenças da Versão Anterior

| Versão Anterior | Versão Windows |
|----------------|----------------|
| SQLite (better-sqlite3) | JSON (arquivo) |
| Precisa compilar C++ | Sem compilação |
| Requer Python/Visual Studio | Apenas Node.js |
| Pode falhar no Windows | Funciona sempre |

## 🌟 Vantagens da Versão JSON

- ✅ **Instalação instantânea** no Windows
- ✅ **Sem dependências nativas** (não precisa compilar)
- ✅ **Portável** (funciona em qualquer SO)
- ✅ **Fácil backup** (apenas copie o arquivo JSON)
- ✅ **Dados legíveis** (pode abrir e editar o JSON)

## 📄 Licença

Este projeto é de uso pessoal e privado.

---

**Desenvolvido com ❤️ para funcionar perfeitamente no Windows!**
