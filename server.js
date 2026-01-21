import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database file
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database
function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [],
            rooms: [],
            room_members: [],
            lists: [],
            notes: [],
            ratings: [],
            sessions: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const db = JSON.parse(data);
        // Garantir que todos os arrays existam (compatibilidade com bancos antigos)
        if (!db.room_members) db.room_members = [];
        if (!db.ratings) db.ratings = [];
        if (!db.sessions) db.sessions = [];
        return db;
    } catch (error) {
        console.error('Error reading database:', error);
        return { 
            users: [], 
            rooms: [], 
            room_members: [], 
            lists: [], 
            notes: [],
            ratings: [],
            sessions: []
        };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
}

initDB();

// ========== USER ROUTES ==========

app.post('/api/users', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    
    if (db.users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    const newUser = {
        id: Date.now(),
        username,
        password,
        created_at: new Date().toISOString()
    };
    
    db.users.push(newUser);
    writeDB(db);
    
    res.json({ id: newUser.id, username: newUser.username });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    res.json({ id: user.id, username: user.username });
});

// ========== ROOM ROUTES ==========

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

app.post('/api/rooms', (req, res) => {
    const { user_id, room_name } = req.body;
    const db = readDB();
    
    const newRoom = {
        id: Date.now(),
        name: room_name,
        code: generateRoomCode(),
        created_by: user_id,
        created_at: new Date().toISOString()
    };
    
    db.rooms.push(newRoom);
    
    // Add creator as member
    db.room_members.push({
        room_id: newRoom.id,
        user_id: user_id,
        joined_at: new Date().toISOString()
    });
    
    writeDB(db);
    res.json(newRoom);
});

app.post('/api/rooms/join', (req, res) => {
    const { user_id, room_code } = req.body;
    const db = readDB();
    
    const room = db.rooms.find(r => r.code === room_code.toUpperCase());
    
    if (!room) {
        return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    // Check if already member
    const isMember = db.room_members.find(m => m.room_id === room.id && m.user_id === user_id);
    
    if (!isMember) {
        db.room_members.push({
            room_id: room.id,
            user_id: user_id,
            joined_at: new Date().toISOString()
        });
        writeDB(db);
    }
    
    res.json(room);
});

app.get('/api/rooms/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const db = readDB();
    
    const userRoomIds = db.room_members
        .filter(m => m.user_id === userId)
        .map(m => m.room_id);
    
    const rooms = db.rooms.filter(r => userRoomIds.includes(r.id));
    res.json(rooms);
});

app.get('/api/rooms/:roomId', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const db = readDB();
    
    const room = db.rooms.find(r => r.id === roomId);
    
    if (!room) {
        return res.status(404).json({ error: 'Sala não encontrada' });
    }
    
    res.json(room);
});

// ========== TMDB API ROUTES - MOVIES ==========

app.get('/api/movies/search', async (req, res) => {
    try {
        const { q } = req.query;
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: q,
                language: 'pt-BR'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error searching movies:', error.message);
        res.status(500).json({ error: 'Erro ao buscar filmes' });
    }
});

app.get('/api/movies/popular', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'pt-BR'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching popular movies:', error.message);
        res.status(500).json({ error: 'Erro ao buscar filmes populares' });
    }
});

app.get('/api/movies/discover', async (req, res) => {
    try {
        const { genre, year } = req.query;
        const params = {
            api_key: TMDB_API_KEY,
            language: 'pt-BR'
        };
        
        if (genre) params.with_genres = genre;
        if (year) params.primary_release_year = year;
        
        const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, { params });
        res.json(response.data);
    } catch (error) {
        console.error('Error discovering movies:', error.message);
        res.status(500).json({ error: 'Erro na busca avançada' });
    }
});

app.get('/api/movies/by-actor', async (req, res) => {
    try {
        const { actor } = req.query;
        
        // Search for actor
        const actorSearch = await axios.get(`${TMDB_BASE_URL}/search/person`, {
            params: {
                api_key: TMDB_API_KEY,
                query: actor,
                language: 'pt-BR'
            }
        });
        
        if (actorSearch.data.results.length === 0) {
            return res.json({ results: [] });
        }
        
        const actorId = actorSearch.data.results[0].id;
        
        // Get movies by actor
        const moviesResponse = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                with_cast: actorId,
                language: 'pt-BR'
            }
        });
        
        res.json(moviesResponse.data);
    } catch (error) {
        console.error('Error searching by actor:', error.message);
        res.status(500).json({ error: 'Erro ao buscar por ator' });
    }
});

app.get('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'pt-BR',
                append_to_response: 'videos,credits'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching movie details:', error.message);
        res.status(500).json({ error: 'Erro ao buscar detalhes do filme' });
    }
});

app.get('/api/movies/:id/providers', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}/watch/providers`, {
            params: {
                api_key: TMDB_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching providers:', error.message);
        res.json({ results: {} });
    }
});

// ========== TMDB API ROUTES - TV SERIES ==========

app.get('/api/tv/search', async (req, res) => {
    try {
        const { q } = req.query;
        const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
            params: {
                api_key: TMDB_API_KEY,
                query: q,
                language: 'pt-BR'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error searching TV series:', error.message);
        res.status(500).json({ error: 'Erro ao buscar séries' });
    }
});

app.get('/api/tv/popular', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'pt-BR'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching popular TV series:', error.message);
        res.status(500).json({ error: 'Erro ao buscar séries populares' });
    }
});

app.get('/api/tv/discover', async (req, res) => {
    try {
        const { genre, year } = req.query;
        const params = {
            api_key: TMDB_API_KEY,
            language: 'pt-BR'
        };
        
        if (genre) params.with_genres = genre;
        if (year) params.first_air_date_year = year;
        
        const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, { params });
        res.json(response.data);
    } catch (error) {
        console.error('Error discovering TV series:', error.message);
        res.status(500).json({ error: 'Erro na busca avançada' });
    }
});

app.get('/api/tv/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'pt-BR',
                append_to_response: 'videos,credits'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching TV series details:', error.message);
        res.status(500).json({ error: 'Erro ao buscar detalhes da série' });
    }
});

app.get('/api/tv/:id/providers', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${id}/watch/providers`, {
            params: {
                api_key: TMDB_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching providers:', error.message);
        res.json({ results: {} });
    }
});

// ========== GENRES ==========

app.get('/api/genres', async (req, res) => {
    try {
        const [movieGenres, tvGenres] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
                params: { api_key: TMDB_API_KEY, language: 'pt-BR' }
            }),
            axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
                params: { api_key: TMDB_API_KEY, language: 'pt-BR' }
            })
        ]);
        
        res.json({
            movie_genres: movieGenres.data.genres,
            tv_genres: tvGenres.data.genres
        });
    } catch (error) {
        console.error('Error fetching genres:', error.message);
        res.status(500).json({ error: 'Erro ao buscar gêneros' });
    }
});

// ========== LISTS (MOVIES & TV) ==========

app.post('/api/rooms/:roomId/items', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const { user_id, item_id, item_type, status } = req.body;
    const db = readDB();
    
    // Check if already exists
    const existing = db.lists.find(
        l => l.room_id === roomId && l.user_id === user_id && 
             l.item_id === item_id && l.item_type === item_type
    );
    
    if (existing) {
        existing.status = status;
        existing.updated_at = new Date().toISOString();
    } else {
        db.lists.push({
            id: Date.now(),
            room_id: roomId,
            user_id: user_id,
            item_id: item_id,
            item_type: item_type,
            status: status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }
    
    writeDB(db);
    res.json({ success: true });
});

app.get('/api/rooms/:roomId/items', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const db = readDB();
    
    const lists = db.lists.filter(l => l.room_id === roomId);
    
    // Add username
    const listsWithUser = lists.map(list => {
        const user = db.users.find(u => u.id === list.user_id);
        return {
            ...list,
            username: user ? user.username : 'Unknown'
        };
    });
    
    res.json(listsWithUser);
});

app.delete('/api/rooms/:roomId/items/:userId/:itemId/:itemType', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const userId = parseInt(req.params.userId);
    const itemId = parseInt(req.params.itemId);
    const itemType = req.params.itemType;
    const db = readDB();
    
    db.lists = db.lists.filter(l => 
        !(l.room_id === roomId && l.user_id === userId && 
          l.item_id === itemId && l.item_type === itemType)
    );
    
    writeDB(db);
    res.json({ success: true });
});

// ========== NOTES ==========

app.post('/api/rooms/:roomId/notes', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const { user_id, item_id, item_type, note } = req.body;
    const db = readDB();
    
    const newNote = {
        id: Date.now(),
        room_id: roomId,
        user_id: user_id,
        item_id: item_id,
        item_type: item_type,
        note: note,
        created_at: new Date().toISOString()
    };
    
    db.notes.push(newNote);
    writeDB(db);
    res.json(newNote);
});

app.get('/api/rooms/:roomId/notes/:itemId/:itemType', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const itemId = parseInt(req.params.itemId);
    const itemType = req.params.itemType;
    const db = readDB();
    
    const notes = db.notes.filter(n => 
        n.room_id === roomId && n.item_id === itemId && n.item_type === itemType
    );
    
    // Add username
    const notesWithUser = notes.map(note => {
        const user = db.users.find(u => u.id === note.user_id);
        return {
            ...note,
            username: user ? user.username : 'Unknown'
        };
    });
    
    res.json(notesWithUser);
});

// ========== RECOMMENDATIONS ==========

app.get('/api/rooms/:roomId/recommendations/:type', async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const type = req.params.type; // 'movie' or 'tv'
        const db = readDB();
        
        // Get room items of this type
        const roomItems = db.lists.filter(l => l.room_id === roomId && l.item_type === type);
        
        if (roomItems.length === 0) {
            return res.json({ results: [] });
        }
        
        // Get random item
        const randomItem = roomItems[Math.floor(Math.random() * roomItems.length)];
        
        // Get recommendations
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${randomItem.item_id}/recommendations`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'pt-BR'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching recommendations:', error.message);
        res.json({ results: [] });
    }
});

// ========== STATISTICS ==========

app.get('/api/rooms/:roomId/stats', async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const db = readDB();
        
        const roomItems = db.lists.filter(l => l.room_id === roomId);
        
        const stats = {
            total_items: roomItems.length,
            total_movies: roomItems.filter(l => l.item_type === 'movie').length,
            total_tv: roomItems.filter(l => l.item_type === 'tv').length,
            watched: roomItems.filter(l => l.status === 'assistido').length,
            watchlist: roomItems.filter(l => l.status === 'quero_assistir').length,
            top_genres: []
        };
        
        // Get genres from items
        const genreCounts = {};
        
        for (const item of roomItems) {
            try {
                const endpoint = item.item_type === 'movie' ? 'movie' : 'tv';
                const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${item.item_id}`, {
                    params: {
                        api_key: TMDB_API_KEY,
                        language: 'pt-BR'
                    }
                });
                
                if (response.data.genres) {
                    response.data.genres.forEach(genre => {
                        genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
                    });
                }
            } catch (error) {
                console.error('Error fetching item for stats:', error.message);
            }
        }
        
        stats.top_genres = Object.entries(genreCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        res.json(stats);
    } catch (error) {
        console.error('Error calculating stats:', error.message);
        res.status(500).json({ error: 'Erro ao calcular estatísticas' });
    }
});

// ========== RODA DA SORTE ==========

// Sortear filme/série da lista "Quero Assistir"
app.get('/api/rooms/:roomId/spin-wheel', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { type } = req.query; // 'movie' ou 'tv'
        
        const db = readDB();
        const watchlist = db.lists.filter(item => 
            item.room_id === parseInt(roomId) && 
            item.status === 'quero_assistir' &&
            (!type || item.item_type === type)
        );
        
        if (watchlist.length === 0) {
            return res.json({ error: 'Lista vazia' });
        }
        
        // Pegar IDs únicos
        const uniqueIds = [...new Set(watchlist.map(item => ({ id: item.item_id, type: item.item_type })))];
        
        // Sortear um aleatório
        const winner = uniqueIds[Math.floor(Math.random() * uniqueIds.length)];
        
        // Buscar detalhes do item sorteado
        const endpoint = winner.type === 'movie' ? 'movie' : 'tv';
        const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${winner.id}`, {
            params: { api_key: TMDB_API_KEY, language: 'pt-BR' }
        });
        
        res.json({ winner: response.data, all_items: uniqueIds });
    } catch (error) {
        console.error('Error spinning wheel:', error.message);
        res.status(500).json({ error: 'Erro ao sortear' });
    }
});

// ========== AVALIAÇÕES (MODO CASAL) ==========

// Adicionar/atualizar avaliação
app.post('/api/rooms/:roomId/ratings', (req, res) => {
    try {
        const { roomId } = req.params;
        const { user_id, item_id, item_type, rating } = req.body;
        
        const db = readDB();
        
        // Verificar se já existe avaliação
        const existingIndex = db.ratings.findIndex(r => 
            r.room_id === parseInt(roomId) &&
            r.user_id === user_id &&
            r.item_id === item_id &&
            r.item_type === item_type
        );
        
        if (existingIndex >= 0) {
            db.ratings[existingIndex].rating = rating;
        } else {
            db.ratings.push({
                room_id: parseInt(roomId),
                user_id,
                item_id,
                item_type,
                rating,
                created_at: new Date().toISOString()
            });
        }
        
        writeDB(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving rating:', error.message);
        res.status(500).json({ error: 'Erro ao salvar avaliação' });
    }
});

// Obter matches (filmes que ambos gostaram)
app.get('/api/rooms/:roomId/matches', async (req, res) => {
    try {
        const { roomId } = req.params;
        const db = readDB();
        
        // Pegar todas as avaliações da sala
        const roomRatings = db.ratings.filter(r => r.room_id === parseInt(roomId));
        
        // Agrupar por item
        const itemRatings = {};
        roomRatings.forEach(rating => {
            const key = `${rating.item_id}_${rating.item_type}`;
            if (!itemRatings[key]) {
                itemRatings[key] = [];
            }
            itemRatings[key].push(rating);
        });
        
        // Encontrar matches (ambos avaliaram >= 4)
        const matches = [];
        for (const [key, ratings] of Object.entries(itemRatings)) {
            if (ratings.length >= 2) {
                const allLiked = ratings.every(r => r.rating >= 4);
                if (allLiked) {
                    const [item_id, item_type] = key.split('_');
                    matches.push({ item_id: parseInt(item_id), item_type, ratings });
                }
            }
        }
        
        // Buscar detalhes dos matches
        const matchDetails = [];
        for (const match of matches) {
            try {
                const endpoint = match.item_type === 'movie' ? 'movie' : 'tv';
                const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${match.item_id}`, {
                    params: { api_key: TMDB_API_KEY, language: 'pt-BR' }
                });
                matchDetails.push(response.data);
            } catch (error) {
                console.error('Error fetching match details:', error.message);
            }
        }
        
        res.json({ matches: matchDetails });
    } catch (error) {
        console.error('Error getting matches:', error.message);
        res.status(500).json({ error: 'Erro ao buscar matches' });
    }
});

// Obter avaliação do usuário para um item
app.get('/api/rooms/:roomId/ratings/:userId/:itemId/:itemType', (req, res) => {
    try {
        const { roomId, userId, itemId, itemType } = req.params;
        const db = readDB();
        
        const rating = db.ratings.find(r => 
            r.room_id === parseInt(roomId) &&
            r.user_id === parseInt(userId) &&
            r.item_id === parseInt(itemId) &&
            r.item_type === itemType
        );
        
        res.json(rating || { rating: 0 });
    } catch (error) {
        console.error('Error getting rating:', error.message);
        res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
});

// ========== SESSÕES AGENDADAS ==========

// Criar sessão agendada
app.post('/api/rooms/:roomId/sessions', (req, res) => {
    try {
        const { roomId } = req.params;
        const { user_id, item_id, item_type, scheduled_date, notes } = req.body;
        
        const db = readDB();
        const sessionId = Date.now();
        
        db.sessions.push({
            id: sessionId,
            room_id: parseInt(roomId),
            user_id,
            item_id,
            item_type,
            scheduled_date,
            notes: notes || '',
            completed: false,
            created_at: new Date().toISOString()
        });
        
        writeDB(db);
        res.json({ success: true, session_id: sessionId });
    } catch (error) {
        console.error('Error creating session:', error.message);
        res.status(500).json({ error: 'Erro ao criar sessão' });
    }
});

// Listar sessões agendadas
app.get('/api/rooms/:roomId/sessions', async (req, res) => {
    try {
        const { roomId } = req.params;
        const db = readDB();
        
        const sessions = db.sessions.filter(s => s.room_id === parseInt(roomId));
        
        // Buscar detalhes dos itens
        const sessionsWithDetails = [];
        for (const session of sessions) {
            try {
                const endpoint = session.item_type === 'movie' ? 'movie' : 'tv';
                const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${session.item_id}`, {
                    params: { api_key: TMDB_API_KEY, language: 'pt-BR' }
                });
                
                const user = db.users.find(u => u.id === session.user_id);
                
                sessionsWithDetails.push({
                    ...session,
                    item: response.data,
                    username: user ? user.username : 'Desconhecido'
                });
            } catch (error) {
                console.error('Error fetching session details:', error.message);
            }
        }
        
        // Ordenar por data
        sessionsWithDetails.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
        
        res.json(sessionsWithDetails);
    } catch (error) {
        console.error('Error getting sessions:', error.message);
        res.status(500).json({ error: 'Erro ao buscar sessões' });
    }
});

// Marcar sessão como completa
app.put('/api/rooms/:roomId/sessions/:sessionId/complete', (req, res) => {
    try {
        const { sessionId } = req.params;
        const db = readDB();
        
        const session = db.sessions.find(s => s.id === parseInt(sessionId));
        if (session) {
            session.completed = true;
            session.completed_at = new Date().toISOString();
            writeDB(db);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Sessão não encontrada' });
        }
    } catch (error) {
        console.error('Error completing session:', error.message);
        res.status(500).json({ error: 'Erro ao completar sessão' });
    }
});

// Deletar sessão
app.delete('/api/rooms/:roomId/sessions/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const db = readDB();
        
        db.sessions = db.sessions.filter(s => s.id !== parseInt(sessionId));
        writeDB(db);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error.message);
        res.status(500).json({ error: 'Erro ao deletar sessão' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🎬 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Banco de dados: ${DB_FILE}`);
});
