-- Usuarios
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password TEXT,
    profile_picture TEXT,
    language VARCHAR(50)
);

-- Navegadores
CREATE TABLE browser (
    browser_id UUID PRIMARY KEY,
    user_agent TEXT,
    device_type BOOLEAN,
    last_access TIMESTAMPTZ
);

-- Relación navegador-usuario
CREATE TABLE browser_users (
    browser_id UUID REFERENCES browser(browser_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (browser_id, user_id)
);

-- Juegos
CREATE TABLE games (
    game_id UUID PRIMARY KEY,
    game_code VARCHAR(100),
    game_status BOOLEAN,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    turn BOOLEAN
);

-- Jugadores
CREATE TABLE players (
    player_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(game_id) ON DELETE CASCADE,
    status BOOLEAN
);

-- Registro de historial
CREATE TABLE record (
    record_id UUID PRIMARY KEY,
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
);

-- Cartas
CREATE TABLE cards (
    card_id UUID PRIMARY KEY,
    card_type BOOLEAN,
    card_color VARCHAR(50),
    card_value INTEGER,
    card_effect TEXT
);

-- Relación jugador-cartas
CREATE TABLE player_cards (
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(card_id) ON DELETE CASCADE,
    PRIMARY KEY (player_id, card_id)
);

-- Conexiones activas
CREATE TABLE connections (
    connection_id UUID PRIMARY KEY,
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    connection_status BOOLEAN,
    last_activity TIMESTAMPTZ
);

-- Resultados
CREATE TABLE results (
    result_id UUID PRIMARY KEY,
    player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(game_id) ON DELETE CASCADE,
    win_status VARCHAR(50)
);
