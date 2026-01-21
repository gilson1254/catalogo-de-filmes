// Configuração
const API_BASE = window.location.origin;
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Estado da aplicação
let currentUser = null;
let currentRoom = null;
let currentType = 'movie'; // 'movie' ou 'tv'
let movieGenres = [];
let tvGenres = [];

// ========== INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', () => {
    // Enter nos formulários
    document.getElementById('loginUsername')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    document.getElementById('registerUsername')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });
    document.getElementById('registerPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });
    document.getElementById('movieSearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMovies();
    });
    document.getElementById('tvSearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchTV();
    });
    
    // Verificar sessão salva
    const savedUser = localStorage.getItem('currentUser');
    const savedRoom = localStorage.getItem('currentRoom');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (savedRoom) {
            currentRoom = JSON.parse(savedRoom);
            showMainScreen();
        } else {
            showRoomSelection();
        }
    }
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('itemModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ========== AUTENTICAÇÃO ==========

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!username || !password) {
        alert('Preencha todos os campos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Conta criada com sucesso!');
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            showLogin();
        } else {
            alert(data.error || 'Erro ao criar conta');
        }
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        alert('Erro ao criar conta.');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Preencha todos os campos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            showRoomSelection();
        } else {
            alert(data.error || 'Credenciais inválidas');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login.');
    }
}

function logout() {
    currentUser = null;
    currentRoom = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentRoom');
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('roomScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'none';
    showLogin();
}

// ========== GERENCIAMENTO DE SALAS ==========

async function showRoomSelection() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('roomScreen').style.display = 'block';
    document.getElementById('roomUserName').textContent = currentUser.username;
    await loadUserRooms();
}

async function loadUserRooms() {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/user/${currentUser.id}`);
        const rooms = await response.json();
        
        const container = document.getElementById('roomsList');
        container.innerHTML = '';
        
        if (rooms.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">Você ainda não tem salas. Crie uma nova ou entre com um código!</p>';
            return;
        }
        
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.innerHTML = `
                <h3>${room.name}</h3>
                <p style="color: rgba(255,255,255,0.6); margin: 10px 0;">Código: <strong style="color: #e63946;">${room.code}</strong></p>
                <button onclick="enterRoom(${room.id})" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #e63946 0%, #d62828 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Entrar</button>
            `;
            container.appendChild(roomCard);
        });
    } catch (error) {
        console.error('Erro ao carregar salas:', error);
    }
}

async function createRoom() {
    const roomName = document.getElementById('newRoomName').value.trim();
    
    if (!roomName) {
        alert('Digite um nome para a sala');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                room_name: roomName
            })
        });
        
        const room = await response.json();
        
        if (response.ok) {
            document.getElementById('newRoomName').value = '';
            alert(`Sala criada! Código: ${room.code}\n\nCompartilhe este código com sua parceira!`);
            await loadUserRooms();
        } else {
            alert('Erro ao criar sala');
        }
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala');
    }
}

async function joinRoom() {
    const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
    
    if (!roomCode) {
        alert('Digite o código da sala');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                room_code: roomCode
            })
        });
        
        const room = await response.json();
        
        if (response.ok) {
            document.getElementById('joinRoomCode').value = '';
            alert(`Você entrou na sala: ${room.name}!`);
            await loadUserRooms();
        } else {
            alert(room.error || 'Sala não encontrada');
        }
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        alert('Erro ao entrar na sala');
    }
}

async function enterRoom(roomId) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${roomId}`);
        const room = await response.json();
        
        if (response.ok) {
            currentRoom = room;
            localStorage.setItem('currentRoom', JSON.stringify(currentRoom));
            showMainScreen();
        } else {
            alert('Erro ao entrar na sala');
        }
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        alert('Erro ao entrar na sala');
    }
}

function backToRooms() {
    currentRoom = null;
    localStorage.removeItem('currentRoom');
    document.getElementById('mainScreen').style.display = 'none';
    showRoomSelection();
}

// ========== TELA PRINCIPAL ==========

async function showMainScreen() {
    document.getElementById('roomScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
    document.getElementById('roomNameHeader').textContent = currentRoom.name;
    document.getElementById('roomCodeHeader').textContent = `Código: ${currentRoom.code}`;
    
    await loadGenres();
    switchType('movie');
}

async function loadGenres() {
    try {
        const response = await fetch(`${API_BASE}/api/genres`);
        const data = await response.json();
        movieGenres = data.movie_genres || [];
        tvGenres = data.tv_genres || [];
        
        // Popular select de filmes
        const movieGenreSelect = document.getElementById('movieGenreFilter');
        if (movieGenreSelect) {
            movieGenreSelect.innerHTML = '<option value="">Todos os gêneros</option>';
            movieGenres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                movieGenreSelect.appendChild(option);
            });
        }
        
        // Popular select de séries
        const tvGenreSelect = document.getElementById('tvGenreFilter');
        if (tvGenreSelect) {
            tvGenreSelect.innerHTML = '<option value="">Todos os gêneros</option>';
            tvGenres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                tvGenreSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar gêneros:', error);
    }
}

// ========== SWITCH ENTRE FILMES E SÉRIES ==========

function showStats() {
    // Atualizar botões
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Esconder todas as seções
    document.getElementById('movieTabs').style.display = 'none';
    document.getElementById('tvTabs').style.display = 'none';
    document.getElementById('statsSection').style.display = 'block';
    
    // Carregar estatísticas
    loadStats();
}

function switchType(type) {
    currentType = type;
    
    // Atualizar botões
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Mostrar/esconder seções
    document.getElementById('movieTabs').style.display = type === 'movie' ? 'block' : 'none';
    document.getElementById('tvTabs').style.display = type === 'tv' ? 'block' : 'none';
    document.getElementById('statsSection').style.display = 'none';
    
    // Carregar conteúdo inicial
    if (type === 'movie') {
        loadPopularMovies();
    } else {
        loadPopularTV();
    }
}

// ========== NAVEGAÇÃO - FILMES ==========

function showMovieTab(tabName) {
    document.querySelectorAll('#movieTabs .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.querySelectorAll('#movieTabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).style.display = 'block';
    event.target.classList.add('active');
    
    if (tabName === 'movieSearchTab') {
        loadPopularMovies();
    } else if (tabName === 'movieWatchedTab') {
        loadWatchedItems('movie');
    } else if (tabName === 'movieWatchlistTab') {
        loadWatchlistItems('movie');
    } else if (tabName === 'movieRecommendationsTab') {
        loadRecommendations('movie');
    }
}

// ========== NAVEGAÇÃO - SÉRIES ==========

function showTVTab(tabName) {
    document.querySelectorAll('#tvTabs .tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.querySelectorAll('#tvTabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).style.display = 'block';
    event.target.classList.add('active');
    
    if (tabName === 'tvSearchTab') {
        loadPopularTV();
    } else if (tabName === 'tvWatchedTab') {
        loadWatchedItems('tv');
    } else if (tabName === 'tvWatchlistTab') {
        loadWatchlistItems('tv');
    } else if (tabName === 'tvRecommendationsTab') {
        loadRecommendations('tv');
    }
}

// ========== BUSCA - FILMES ==========

async function searchMovies() {
    const query = document.getElementById('movieSearchInput').value.trim();
    if (!query) {
        alert('Digite o nome de um filme');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/movies/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displayItems(data.results || [], 'movieSearchResults', 'movie');
    } catch (error) {
        console.error('Erro ao buscar filmes:', error);
        alert('Erro ao buscar filmes');
    }
}

async function loadPopularMovies() {
    try {
        const response = await fetch(`${API_BASE}/api/movies/popular`);
        const data = await response.json();
        displayItems(data.results || [], 'movieSearchResults', 'movie');
    } catch (error) {
        console.error('Erro ao carregar filmes populares:', error);
    }
}

async function advancedSearchMovies() {
    const genre = document.getElementById('movieGenreFilter').value;
    const year = document.getElementById('movieYearFilter').value;

    try {
        let url = `${API_BASE}/api/movies/discover?`;
        if (genre) url += `genre=${genre}&`;
        if (year) url += `year=${year}&`;

        const response = await fetch(url);
        const data = await response.json();
        displayItems(data.results || [], 'movieSearchResults', 'movie');
    } catch (error) {
        console.error('Erro na busca avançada:', error);
        alert('Erro na busca avançada');
    }
}

// ========== BUSCA - SÉRIES ==========

async function searchTV() {
    const query = document.getElementById('tvSearchInput').value.trim();
    if (!query) {
        alert('Digite o nome da série');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/tv/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displayItems(data.results || [], 'tvSearchResults', 'tv');
    } catch (error) {
        console.error('Erro ao buscar séries:', error);
        alert('Erro ao buscar séries');
    }
}

async function loadPopularTV() {
    try {
        const response = await fetch(`${API_BASE}/api/tv/popular`);
        const data = await response.json();
        displayItems(data.results || [], 'tvSearchResults', 'tv');
    } catch (error) {
        console.error('Erro ao carregar séries populares:', error);
    }
}

async function advancedSearchTV() {
    const genre = document.getElementById('tvGenreFilter').value;
    const year = document.getElementById('tvYearFilter').value;

    try {
        let url = `${API_BASE}/api/tv/discover?`;
        if (genre) url += `genre=${genre}&`;
        if (year) url += `year=${year}&`;

        const response = await fetch(url);
        const data = await response.json();
        displayItems(data.results || [], 'tvSearchResults', 'tv');
    } catch (error) {
        console.error('Erro na busca avançada:', error);
        alert('Erro na busca avançada');
    }
}

// ========== EXIBIÇÃO DE ITENS ==========

function displayItems(items, containerId, itemType) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Nenhum resultado encontrado</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const posterPath = item.poster_path 
            ? `${IMG_BASE}${item.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
        
        const title = item.title || item.name;
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

        card.innerHTML = `
            <img src="${posterPath}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=Sem+Imagem'">
            <div class="movie-card-content">
                <h3>${title}</h3>
                <div class="rating">⭐ ${rating}</div>
                <div class="actions">
                    <button class="btn-details" onclick="showItemDetails(${item.id}, '${itemType}')">Detalhes</button>
                    <button class="btn-watched" onclick="addToList(${item.id}, '${itemType}', 'assistido')">✓ Assistido</button>
                    <button class="btn-watchlist" onclick="addToList(${item.id}, '${itemType}', 'quero_assistir')">+ Quero Ver</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========== DETALHES DO ITEM ==========

async function showItemDetails(itemId, itemType) {
    try {
        const endpoint = itemType === 'movie' ? 'movies' : 'tv';
        const [itemResponse, providersResponse, notesResponse] = await Promise.all([
            fetch(`${API_BASE}/api/${endpoint}/${itemId}`),
            fetch(`${API_BASE}/api/${endpoint}/${itemId}/providers`),
            fetch(`${API_BASE}/api/rooms/${currentRoom.id}/notes/${itemId}/${itemType}`)
        ]);
        
        const item = await itemResponse.json();
        const providersData = await providersResponse.json();
        const notes = await notesResponse.json();
        
        const modal = document.getElementById('itemModal');
        const detailsDiv = document.getElementById('itemDetails');
        
        const posterPath = item.poster_path 
            ? `${IMG_BASE}${item.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
        
        const title = item.title || item.name;
        const releaseDate = item.release_date || item.first_air_date || 'N/A';
        
        const trailer = item.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const trailerHTML = trailer 
            ? `<div class="trailer-container">
                <h3>🎬 Trailer</h3>
                <iframe 
                    src="https://www.youtube.com/embed/${trailer.key}" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
               </div>`
            : '<p style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">Trailer não disponível</p>';
        
        const cast = item.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'Não disponível';
        
        // Informações específicas
        let specificInfo = '';
        if (itemType === 'movie') {
            specificInfo = `<p><strong>Duração:</strong> ${item.runtime ? item.runtime + ' min' : 'N/A'}</p>`;
        } else {
            const seasons = item.number_of_seasons || 'N/A';
            const episodes = item.number_of_episodes || 'N/A';
            specificInfo = `
                <p><strong>Temporadas:</strong> ${seasons}</p>
                <p><strong>Episódios:</strong> ${episodes}</p>
                <p><strong>Status:</strong> ${item.status || 'N/A'}</p>
            `;
        }
        
        // Plataformas de streaming
        const providers = providersData.results?.BR;
        let streamingHTML = '';
        
        if (providers) {
            const streamServices = providers.flatrate || [];
            
            if (streamServices.length > 0) {
                streamingHTML += '<div style="margin-bottom: 20px;"><h4 style="color: #e63946; margin-bottom: 10px;">📺 Disponível para Assistir:</h4><div style="display: flex; gap: 15px; flex-wrap: wrap;">';
                streamServices.forEach(service => {
                    streamingHTML += `
                        <div style="text-align: center;">
                            <img src="${IMG_BASE}${service.logo_path}" alt="${service.provider_name}" 
                                 style="width: 60px; height: 60px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                            <p style="font-size: 12px; margin-top: 5px; color: rgba(255,255,255,0.8);">${service.provider_name}</p>
                        </div>
                    `;
                });
                streamingHTML += '</div></div>';
            }
        }
        
        if (!streamingHTML) {
            streamingHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center; padding: 20px;">❌ Não disponível em plataformas de streaming no Brasil</p>';
        }
        
        // Notas privadas
        let notesHTML = '<div style="margin-top: 30px; background: rgba(0,0,0,0.3); padding: 25px; border-radius: 20px;"><h3 style="color: #fff; margin-bottom: 20px;">💬 Notas Privadas</h3>';
        
        if (notes.length > 0) {
            notes.forEach(note => {
                notesHTML += `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 10px; border-left: 3px solid #e63946;">
                        <p style="color: #e63946; font-weight: 600; margin-bottom: 5px;">${note.username}</p>
                        <p style="color: rgba(255,255,255,0.9);">${note.note}</p>
                    </div>
                `;
            });
        } else {
            notesHTML += '<p style="color: rgba(255,255,255,0.6); text-align: center;">Nenhuma nota ainda</p>';
        }
        
        notesHTML += `
            <div style="margin-top: 20px;">
                <textarea id="newNote" placeholder="Adicione sua nota privada..." style="width: 100%; padding: 15px; border: 2px solid rgba(255,255,255,0.2); border-radius: 12px; background: rgba(255,255,255,0.1); color: white; font-size: 15px; min-height: 80px; resize: vertical;"></textarea>
                <button onclick="addNote(${itemId}, '${itemType}')" style="margin-top: 10px; width: 100%; padding: 12px; background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">Salvar Nota</button>
            </div>
        </div>`;
        
        detailsDiv.innerHTML = `
            <div class="movie-detail-header">
                <img src="${posterPath}" alt="${title}">
                <div class="movie-detail-info">
                    <h2>${title}</h2>
                    <div class="meta">
                        <p><strong>Avaliação TMDb:</strong> ⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</p>
                        <p><strong>Lançamento:</strong> ${releaseDate}</p>
                        ${specificInfo}
                        <p><strong>Gêneros:</strong> ${item.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
                        <p><strong>Elenco Principal:</strong> ${cast}</p>
                    </div>
                    
                    <!-- Sistema de Avaliação do Casal -->
                    <div style="background: rgba(230, 57, 70, 0.1); padding: 20px; border-radius: 15px; margin: 20px 0; border: 2px solid rgba(230, 57, 70, 0.3);">
                        <h4 style="color: #e63946; margin-bottom: 15px; text-align: center;">💑 Sua Avaliação (Modo Casal)</h4>
                        <div style="display: flex; justify-content: center; gap: 10px; font-size: 2em;" id="ratingStars">
                            <span onclick="setRating(${itemId}, '${itemType}', 1)" style="cursor: pointer; transition: all 0.2s;" data-rating="1">☆</span>
                            <span onclick="setRating(${itemId}, '${itemType}', 2)" style="cursor: pointer; transition: all 0.2s;" data-rating="2">☆</span>
                            <span onclick="setRating(${itemId}, '${itemType}', 3)" style="cursor: pointer; transition: all 0.2s;" data-rating="3">☆</span>
                            <span onclick="setRating(${itemId}, '${itemType}', 4)" style="cursor: pointer; transition: all 0.2s;" data-rating="4">☆</span>
                            <span onclick="setRating(${itemId}, '${itemType}', 5)" style="cursor: pointer; transition: all 0.2s;" data-rating="5">☆</span>
                        </div>
                        <p style="text-align: center; color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 10px;">Avalie com 4+ estrelas para aparecer nos Matches! ❤️</p>
                    </div>
                    
                    <!-- Botão Agendar Sessão -->
                    <button onclick="scheduleSession(${itemId}, '${itemType}', '${title.replace(/'/g, "\\'")}')" class="btn-schedule-session">
                        <span class="btn-icon">📅</span>
                        <span class="btn-text">Agendar Sessão Cinema em Casa</span>
                    </button>
                    
                    <div class="overview">
                        <h3>Sinopse</h3>
                        <p>${item.overview || 'Sinopse não disponível'}</p>
                    </div>
                </div>
            </div>
            <script>
                // Carregar avaliação existente
                fetch('${API_BASE}/api/rooms/${currentRoom.id}/ratings/${currentUser.id}/${itemId}/${itemType}')
                    .then(r => r.json())
                    .then(data => {
                        if (data.rating) {
                            const stars = document.querySelectorAll('#ratingStars span');
                            stars.forEach((star, index) => {
                                if (index < data.rating) {
                                    star.textContent = '★';
                                    star.style.color = '#f39c12';
                                }
                            });
                        }
                    });
            </script>
            
            <div style="margin-top: 30px; background: rgba(0,0,0,0.3); padding: 25px; border-radius: 20px; border: 2px solid rgba(230, 57, 70, 0.2);">
                <h3 style="color: #fff; margin-bottom: 20px; font-size: 1.5em; text-align: center;">🎬 Onde Assistir</h3>
                ${streamingHTML}
            </div>
            
            ${trailerHTML}
            ${notesHTML}
        `;
        
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes');
    }
}

function closeModal() {
    document.getElementById('itemModal').style.display = 'none';
}

// ========== NOTAS PRIVADAS ==========

async function addNote(itemId, itemType) {
    const noteText = document.getElementById('newNote').value.trim();
    
    if (!noteText) {
        alert('Digite uma nota');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                item_id: itemId,
                item_type: itemType,
                note: noteText
            })
        });
        
        if (response.ok) {
            alert('Nota salva!');
            showItemDetails(itemId, itemType);
        } else {
            alert('Erro ao salvar nota');
        }
    } catch (error) {
        console.error('Erro ao salvar nota:', error);
        alert('Erro ao salvar nota');
    }
}

// ========== LISTAS ==========

async function addToList(itemId, itemType, status) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                item_id: itemId,
                item_type: itemType,
                status: status
            })
        });

        if (response.ok) {
            const typeLabel = itemType === 'movie' ? 'Filme' : 'Série';
            alert(`${typeLabel} adicionado: ${status === 'assistido' ? 'Assistidos' : 'Quero Assistir'}`);
        } else {
            alert('Erro ao adicionar');
        }
    } catch (error) {
        console.error('Erro ao adicionar:', error);
        alert('Erro ao adicionar');
    }
}

async function removeFromList(itemId, itemType) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/items/${currentUser.id}/${itemId}/${itemType}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Removido da lista');
            // Recarregar lista atual
            if (currentType === 'movie') {
                const activeTab = document.querySelector('#movieTabs .tab.active').textContent;
                if (activeTab.includes('Assistidos')) {
                    loadWatchedItems('movie');
                } else {
                    loadWatchlistItems('movie');
                }
            } else {
                const activeTab = document.querySelector('#tvTabs .tab.active').textContent;
                if (activeTab.includes('Assistidas')) {
                    loadWatchedItems('tv');
                } else {
                    loadWatchlistItems('tv');
                }
            }
        } else {
            alert('Erro ao remover');
        }
    } catch (error) {
        console.error('Erro ao remover:', error);
        alert('Erro ao remover');
    }
}

async function loadWatchedItems(itemType) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/items`);
        const lists = await response.json();
        
        const watchedIds = lists
            .filter(item => item.status === 'assistido' && item.item_type === itemType)
            .map(item => item.item_id);
        const uniqueIds = [...new Set(watchedIds)];
        
        const containerId = itemType === 'movie' ? 'movieWatchedResults' : 'tvWatchedResults';
        
        if (uniqueIds.length === 0) {
            document.getElementById(containerId).innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Nenhum item assistido ainda</p>';
            return;
        }
        
        const endpoint = itemType === 'movie' ? 'movies' : 'tv';
        const items = await Promise.all(
            uniqueIds.map(id => fetch(`${API_BASE}/api/${endpoint}/${id}`).then(r => r.json()))
        );
        
        displayRoomItems(items, containerId, itemType, lists);
    } catch (error) {
        console.error('Erro ao carregar assistidos:', error);
    }
}

async function loadWatchlistItems(itemType) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/items`);
        const lists = await response.json();
        
        const watchlistIds = lists
            .filter(item => item.status === 'quero_assistir' && item.item_type === itemType)
            .map(item => item.item_id);
        const uniqueIds = [...new Set(watchlistIds)];
        
        const containerId = itemType === 'movie' ? 'movieWatchlistResults' : 'tvWatchlistResults';
        
        if (uniqueIds.length === 0) {
            document.getElementById(containerId).innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Nenhum item na lista</p>';
            return;
        }
        
        const endpoint = itemType === 'movie' ? 'movies' : 'tv';
        const items = await Promise.all(
            uniqueIds.map(id => fetch(`${API_BASE}/api/${endpoint}/${id}`).then(r => r.json()))
        );
        
        displayRoomItems(items, containerId, itemType, lists);
    } catch (error) {
        console.error('Erro ao carregar lista:', error);
    }
}

function displayRoomItems(items, containerId, itemType, lists) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const posterPath = item.poster_path 
            ? `${IMG_BASE}${item.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
        
        const title = item.title || item.name;
        const usersForItem = lists.filter(l => l.item_id === item.id && l.item_type === itemType);
        const usersList = usersForItem.map(u => u.username).join(', ');

        card.innerHTML = `
            <img src="${posterPath}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=Sem+Imagem'">
            <div class="movie-card-content">
                <h3>${title}</h3>
                <div class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</div>
                <p style="font-size: 12px; color: rgba(255,255,255,0.6); margin: 8px 0;">Por: ${usersList}</p>
                <div class="actions">
                    <button class="btn-details" onclick="showItemDetails(${item.id}, '${itemType}')">Detalhes</button>
                    <button class="btn-remove" onclick="removeFromList(${item.id}, '${itemType}')">Remover</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========== RECOMENDAÇÕES ==========

async function loadRecommendations(itemType) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/recommendations/${itemType}`);
        const data = await response.json();
        const items = data.results || [];
        
        const containerId = itemType === 'movie' ? 'movieRecommendationsResults' : 'tvRecommendationsResults';
        
        if (items.length === 0) {
            document.getElementById(containerId).innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Adicione alguns itens primeiro para receber recomendações personalizadas!</p>';
            return;
        }
        
        displayItems(items, containerId, itemType);
    } catch (error) {
        console.error('Erro ao carregar recomendações:', error);
    }
}

// ========== ESTATÍSTICAS ==========

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/stats`);
        const stats = await response.json();
        
        const container = document.getElementById('statsContent');
        
        let genresHTML = '';
        if (stats.top_genres && stats.top_genres.length > 0) {
            genresHTML = stats.top_genres.map(genre => 
                `<div style="background: rgba(230, 57, 70, 0.2); padding: 12px 20px; border-radius: 10px; border: 2px solid rgba(230, 57, 70, 0.4);">
                    <strong style="color: #e63946;">${genre.name}</strong>: ${genre.count} ${genre.count > 1 ? 'itens' : 'item'}
                </div>`
            ).join('');
        } else {
            genresHTML = '<p style="color: rgba(255,255,255,0.6);">Adicione itens para ver estatísticas</p>';
        }
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 25px; margin-bottom: 40px;">
                <div class="stat-card">
                    <div class="stat-number">${stats.total_items}</div>
                    <div class="stat-label">Total de Itens</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.total_movies}</div>
                    <div class="stat-label">Filmes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.total_tv}</div>
                    <div class="stat-label">Séries</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.watched}</div>
                    <div class="stat-label">Assistidos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.watchlist}</div>
                    <div class="stat-label">Quero Assistir</div>
                </div>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 30px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <h3 style="color: #e63946; margin-bottom: 20px; font-size: 1.4em;">🎭 Gêneros Favoritos</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${genresHTML}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}


// ========== RODA DA SORTE ==========

function showSpinWheel() {
    // Atualizar botões
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Esconder todas as seções
    document.getElementById('movieTabs').style.display = 'none';
    document.getElementById('tvTabs').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('matchesSection').style.display = 'none';
    document.getElementById('sessionsSection').style.display = 'none';
    document.getElementById('spinWheelSection').style.display = 'block';
}

async function spinWheel(type) {
    const resultDiv = document.getElementById('wheelResult');
    
    // Animação de carregamento
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <div style="font-size: 5em; animation: spin 1s linear infinite;">🎲</div>
            <p style="color: white; font-size: 1.5em; margin-top: 20px;">Girando a roda...</p>
        </div>
        <style>
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    try {
        const url = type 
            ? `${API_BASE}/api/rooms/${currentRoom.id}/spin-wheel?type=${type}`
            : `${API_BASE}/api/rooms/${currentRoom.id}/spin-wheel`;
            
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `
                <div style="text-align: center; padding: 60px; background: rgba(255, 255, 255, 0.05); border-radius: 20px;">
                    <p style="color: #e63946; font-size: 1.5em;">❌ ${data.error}</p>
                    <p style="color: rgba(255,255,255,0.7); margin-top: 15px;">Adicione filmes/séries na lista "Quero Ver" primeiro!</p>
                </div>
            `;
            return;
        }
        
        // Simular delay da animação
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const winner = data.winner;
        const title = winner.title || winner.name;
        const posterPath = winner.poster_path 
            ? `${IMG_BASE}${winner.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
        
        resultDiv.innerHTML = `
            <div style="text-align: center; animation: fadeInScale 0.8s ease-out;">
                <div style="font-size: 4em; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #e63946; font-size: 2.5em; margin-bottom: 30px;">O Sorteado Foi...</h2>
                
                <div style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 40px; border-radius: 25px; border: 3px solid rgba(230, 57, 70, 0.4); box-shadow: 0 20px 60px rgba(230, 57, 70, 0.3);">
                    <img src="${posterPath}" alt="${title}" style="width: 300px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); margin-bottom: 25px;">
                    <h3 style="color: white; font-size: 2em; margin-bottom: 15px;">${title}</h3>
                    <p style="color: rgba(255,255,255,0.8); font-size: 1.1em; margin-bottom: 25px;">${winner.overview || 'Sem sinopse disponível'}</p>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="showItemDetails(${winner.id}, '${winner.title ? 'movie' : 'tv'}')" style="padding: 15px 30px; background: linear-gradient(135deg, #e63946 0%, #d62828 100%); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">Ver Detalhes</button>
                        <button onclick="spinWheel(${type ? `'${type}'` : ''})" style="padding: 15px 30px; background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">Sortear Novamente</button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            </style>
        `;
    } catch (error) {
        console.error('Erro ao sortear:', error);
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <p style="color: #e63946; font-size: 1.5em;">❌ Erro ao sortear</p>
            </div>
        `;
    }
}

// ========== MODO CASAL (MATCHES) ==========

function showMatches() {
    // Atualizar botões
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Esconder todas as seções
    document.getElementById('movieTabs').style.display = 'none';
    document.getElementById('tvTabs').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('spinWheelSection').style.display = 'none';
    document.getElementById('sessionsSection').style.display = 'none';
    document.getElementById('matchesSection').style.display = 'block';
    
    loadMatches();
}

async function loadMatches() {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/matches`);
        const data = await response.json();
        const matches = data.matches || [];
        
        const container = document.getElementById('matchesResults');
        container.innerHTML = '';
        
        if (matches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; background: rgba(255, 255, 255, 0.05); border-radius: 20px; grid-column: 1 / -1;">
                    <div style="font-size: 4em; margin-bottom: 20px;">💔</div>
                    <h3 style="color: white; font-size: 1.8em; margin-bottom: 15px;">Ainda não há matches!</h3>
                    <p style="color: rgba(255,255,255,0.7); line-height: 1.8;">
                        Avaliem filmes e séries com 4+ estrelas para descobrir o que vocês dois amam! ❤️<br>
                        <small style="color: rgba(255,255,255,0.5);">Dica: Avaliem nos detalhes de cada filme/série</small>
                    </p>
                </div>
            `;
            return;
        }
        
        matches.forEach(item => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            const posterPath = item.poster_path 
                ? `${IMG_BASE}${item.poster_path}` 
                : 'https://via.placeholder.com/500x750?text=Sem+Imagem';
            
            const title = item.title || item.name;
            const itemType = item.title ? 'movie' : 'tv';
            
            card.innerHTML = `
                <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #e63946 0%, #d62828 100%); padding: 8px 15px; border-radius: 20px; font-weight: 700; z-index: 1;">
                    💕 MATCH!
                </div>
                <img src="${posterPath}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=Sem+Imagem'">
                <div class="movie-card-content">
                    <h3>${title}</h3>
                    <div class="rating">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</div>
                    <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 10px 0;">Vocês dois amaram! ❤️</p>
                    <div class="actions">
                        <button class="btn-details" onclick="showItemDetails(${item.id}, '${itemType}')">Ver Detalhes</button>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar matches:', error);
    }
}

async function rateItem(itemId, itemType, rating) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/ratings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                item_id: itemId,
                item_type: itemType,
                rating: rating
            })
        });
        
        if (response.ok) {
            return true;
        }
    } catch (error) {
        console.error('Erro ao avaliar:', error);
    }
    return false;
}

// ========== SESSÕES AGENDADAS ==========

function showSessions() {
    // Atualizar botões
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Esconder todas as seções
    document.getElementById('movieTabs').style.display = 'none';
    document.getElementById('tvTabs').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('spinWheelSection').style.display = 'none';
    document.getElementById('matchesSection').style.display = 'none';
    document.getElementById('sessionsSection').style.display = 'block';
    
    loadSessions();
}

async function loadSessions() {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/sessions`);
        const sessions = await response.json();
        
        const container = document.getElementById('sessionsCalendar');
        container.innerHTML = '';
        
        // Botão para criar nova sessão
        const createButton = document.createElement('div');
        createButton.style.cssText = 'text-align: center; margin-bottom: 40px;';
        createButton.innerHTML = `
            <button onclick="showCreateSessionForm()" style="padding: 15px 40px; background: linear-gradient(135deg, #e63946 0%, #d62828 100%); color: white; border: none; border-radius: 15px; font-size: 18px; font-weight: 700; cursor: pointer;">
                ➕ Agendar Nova Sessão
            </button>
        `;
        container.appendChild(createButton);
        
        if (sessions.length === 0) {
            container.innerHTML += `
                <div style="text-align: center; padding: 60px; background: rgba(255, 255, 255, 0.05); border-radius: 20px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">📅</div>
                    <h3 style="color: white; font-size: 1.8em; margin-bottom: 15px;">Nenhuma sessão agendada</h3>
                    <p style="color: rgba(255,255,255,0.7);">Agende uma sessão cinema em casa com sua parceira! 🍿</p>
                </div>
            `;
            return;
        }
        
        // Separar sessões futuras e passadas
        const now = new Date();
        const upcoming = sessions.filter(s => !s.completed && new Date(s.scheduled_date) >= now);
        const past = sessions.filter(s => s.completed || new Date(s.scheduled_date) < now);
        
        // Sessões futuras
        if (upcoming.length > 0) {
            const upcomingSection = document.createElement('div');
            upcomingSection.style.cssText = 'margin-bottom: 40px;';
            upcomingSection.innerHTML = '<h3 style="color: #e63946; margin-bottom: 20px; font-size: 1.5em;">🎬 Próximas Sessões</h3>';
            
            const upcomingGrid = document.createElement('div');
            upcomingGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px;';
            
            upcoming.forEach(session => {
                upcomingGrid.appendChild(createSessionCard(session, false));
            });
            
            upcomingSection.appendChild(upcomingGrid);
            container.appendChild(upcomingSection);
        }
        
        // Sessões passadas
        if (past.length > 0) {
            const pastSection = document.createElement('div');
            pastSection.innerHTML = '<h3 style="color: rgba(255,255,255,0.5); margin-bottom: 20px; font-size: 1.5em;">✅ Sessões Passadas</h3>';
            
            const pastGrid = document.createElement('div');
            pastGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; opacity: 0.6;';
            
            past.forEach(session => {
                pastGrid.appendChild(createSessionCard(session, true));
            });
            
            pastSection.appendChild(pastGrid);
            container.appendChild(pastSection);
        }
    } catch (error) {
        console.error('Erro ao carregar sessões:', error);
    }
}

function createSessionCard(session, isPast) {
    const card = document.createElement('div');
    card.style.cssText = 'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; border: 2px solid rgba(255, 255, 255, 0.1);';
    
    const item = session.item;
    const title = item.title || item.name;
    const date = new Date(session.scheduled_date);
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const posterPath = item.poster_path 
        ? `${IMG_BASE}${item.poster_path}` 
        : 'https://via.placeholder.com/200x300?text=Sem+Imagem';
    
    card.innerHTML = `
        <div style="display: flex; gap: 20px;">
            <img src="${posterPath}" alt="${title}" style="width: 100px; height: 150px; object-fit: cover; border-radius: 10px;">
            <div style="flex: 1;">
                <h4 style="color: white; font-size: 1.2em; margin-bottom: 10px;">${title}</h4>
                <p style="color: #e63946; font-weight: 600; margin-bottom: 5px;">📅 ${dateStr}</p>
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 5px;">🕐 ${timeStr}</p>
                <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 10px;">Por: ${session.username}</p>
                ${session.notes ? `<p style="color: rgba(255,255,255,0.7); font-style: italic; font-size: 14px; margin-top: 10px;">"${session.notes}"</p>` : ''}
                ${!isPast && !session.completed ? `
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button onclick="completeSession(${session.id})" style="padding: 8px 15px; background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">✓ Marcar como Assistido</button>
                        <button onclick="deleteSession(${session.id})" style="padding: 8px 15px; background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 2px solid #e74c3c; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">🗑️ Excluir</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

function showCreateSessionForm() {
    // Implementação simplificada - pode ser expandida
    alert('Para agendar uma sessão, vá nos detalhes de um filme/série e clique em "Agendar Sessão"!');
}

async function completeSession(sessionId) {
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/sessions/${sessionId}/complete`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Sessão marcada como assistida! 🎉');
            loadSessions();
        }
    } catch (error) {
        console.error('Erro ao completar sessão:', error);
    }
}

async function deleteSession(sessionId) {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Sessão excluída!');
            loadSessions();
        }
    } catch (error) {
        console.error('Erro ao deletar sessão:', error);
    }
}


// ========== SISTEMA DE AVALIAÇÃO ==========

async function setRating(itemId, itemType, rating) {
    try {
        const success = await rateItem(itemId, itemType, rating);
        
        if (success) {
            // Atualizar estrelas visualmente
            const stars = document.querySelectorAll('#ratingStars span');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.textContent = '★';
                    star.style.color = '#f39c12';
                } else {
                    star.textContent = '☆';
                    star.style.color = 'rgba(255,255,255,0.5)';
                }
            });
            
            // Feedback visual
            const container = document.querySelector('#ratingStars').parentElement;
            const feedback = document.createElement('p');
            feedback.style.cssText = 'text-align: center; color: #27ae60; font-weight: 600; margin-top: 10px; animation: fadeIn 0.5s;';
            feedback.textContent = `✓ Avaliação salva: ${rating} ${rating > 1 ? 'estrelas' : 'estrela'}!`;
            
            // Remover feedback anterior se existir
            const oldFeedback = container.querySelector('p[style*="color: #27ae60"]');
            if (oldFeedback) oldFeedback.remove();
            
            container.appendChild(feedback);
            
            // Remover feedback após 3 segundos
            setTimeout(() => feedback.remove(), 3000);
        }
    } catch (error) {
        console.error('Erro ao avaliar:', error);
        alert('Erro ao salvar avaliação');
    }
}

// ========== AGENDAR SESSÃO ==========

function scheduleSession(itemId, itemType, title) {
    const modal = document.createElement('div');
    modal.id = 'scheduleSessionModal';
    modal.className = 'schedule-modal-overlay';
    
    modal.innerHTML = `
        <div class="schedule-modal-content">
            <div class="schedule-modal-header">
                <div class="schedule-modal-icon">📅</div>
                <h2>Agendar Sessão</h2>
                <p>Prepare o clima para assistir <strong>${title}</strong></p>
            </div>
            
            <div class="schedule-modal-body">
                <div class="input-group">
                    <label><i class="icon-clock">⏰</i> Data e Hora:</label>
                    <input type="datetime-local" id="sessionDateTime">
                </div>
                
                <div class="input-group">
                    <label><i class="icon-notes">📝</i> Notas Especiais:</label>
                    <textarea id="sessionNotes" placeholder="Ex: Preparar pipoca, comprar refrigerante, apagar as luzes..."></textarea>
                </div>
            </div>
            
            <div class="schedule-modal-footer">
                <button onclick="closeScheduleSessionModal()" class="btn-cancel">Cancelar</button>
                <button onclick="confirmScheduleSession(${itemId}, '${itemType}')" class="btn-confirm">Confirmar Agendamento</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Definir data mínima como agora
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('sessionDateTime').min = now.toISOString().slice(0, 16);
    
    // Animação de entrada
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeScheduleSessionModal() {
    const modal = document.getElementById('scheduleSessionModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

async function confirmScheduleSession(itemId, itemType) {
    const dateTime = document.getElementById('sessionDateTime').value;
    const notes = document.getElementById('sessionNotes').value.trim();
    
    if (!dateTime) {
        alert('Selecione uma data e hora!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                item_id: itemId,
                item_type: itemType,
                scheduled_date: new Date(dateTime).toISOString(),
                notes: notes
            })
        });
        
        if (response.ok) {
            alert('Sessão agendada com sucesso! 🎉');
            // Fechar modal de agendamento
            closeScheduleSessionModal();
        } else {
            alert('Erro ao agendar sessão');
        }
    } catch (error) {
        console.error('Erro ao agendar sessão:', error);
        alert('Erro ao agendar sessão');
    }
}
