// Получаем данные из localStorage
const players = JSON.parse(localStorage.getItem('badmintonPlayers')) || [];
const trainings = JSON.parse(localStorage.getItem('badmintonTrainings')) || [];

// Получаем ID тренировки из URL
const urlParams = new URLSearchParams(window.location.search);
const trainingId = parseInt(urlParams.get('id'));

// Данные текущей тренировки
let currentTraining = null;
let courtsData = [];
let queuePlayers = [];
let activeGames = {}; // Хранит информацию об активных играх на кортах

// DOM элементы
const trainingInfoElement = document.getElementById('training-info');
const courtsContainer = document.getElementById('courts-container');
const playersQueue = document.getElementById('players-queue');
const backToMainBtn = document.getElementById('back-to-main');
const gameRegulationSelect = document.getElementById('game-regulation');

// Проверка, что элементы найдены
console.log('backToMainBtn:', backToMainBtn);

// Функция для создания аватара с инициалами
function createInitialsAvatar(firstName, lastName) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Создаем круглый фон
    ctx.fillStyle = getRandomColor(firstName + lastName);
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.fill();

    // Получаем инициалы
    const initials = getInitials(firstName, lastName);

    // Рисуем инициалы
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 100, 100);

    // Возвращаем как data URL
    return canvas.toDataURL('image/png');
}

// Функция для получения инициалов
function getInitials(firstName, lastName) {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
}

// Функция для генерации случайного цвета на основе строки
function getRandomColor(str) {
    // Генерируем хеш строки
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Преобразуем хеш в цвет
    const colors = [
        '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
        '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
        '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
        '#d35400', '#c0392b', '#7f8c8d'
    ];

    // Используем хеш для выбора цвета из массива
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

// Создаем дефолтное изображение для случаев, когда нет имени и фамилии
function createDefaultAvatar() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Создаем круглый фон
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.fill();

    // Рисуем силуэт
    ctx.fillStyle = '#a0a0a0';
    ctx.beginPath();
    ctx.arc(100, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    // Рисуем тело
    ctx.beginPath();
    ctx.arc(100, 200, 60, Math.PI, 0, true);
    ctx.fill();

    // Соединяем голову и тело
    ctx.fillRect(60, 80, 80, 80);

    // Возвращаем как data URL
    return canvas.toDataURL('image/png');
}

const defaultAvatarDataURL = createDefaultAvatar();

// Функция для форматирования времени в формат MM:SS
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Инициализация тренировки
function initTrainingSession() {
    if (trainingId === null || isNaN(trainingId) || trainingId < 0 || trainingId >= trainings.length) {
        alert('Некорректный ID тренировки');
        window.location.href = 'index.html';
        return;
    }
    
    currentTraining = trainings[trainingId];
    
    // Отображаем информацию о тренировке
    displayTrainingInfo();

    // Устанавливаем значение регламента из сохраненных данных или по умолчанию
    if (currentTraining.gameRegulation) {
        gameRegulationSelect.value = currentTraining.gameRegulation;
    } else {
        // По умолчанию "Два раза и вышел"
        currentTraining.gameRegulation = 'two_games_out';
        gameRegulationSelect.value = 'two_games_out';
    }
    
    // Инициализируем корты
    initCourts();
    
    // Инициализируем очередь игроков
    initQueue();
    
    // Восстанавливаем активные игры, если они есть
    if (currentTraining.activeGames) {
        for (const courtId in currentTraining.activeGames) {
            const gameData = currentTraining.activeGames[courtId];

            // Создаем активную игру
            activeGames[courtId] = {
                startTime: gameData.startTime,
                elapsedTime: gameData.elapsedTime,
                timerId: null
            };

            // Запускаем таймер
            activeGames[courtId].timerId = setInterval(() => {
                activeGames[courtId].elapsedTime = Date.now() - activeGames[courtId].startTime;

                // Обновляем отображение таймера
                const timerElement = document.getElementById(`timer-${courtId}`);
                if (timerElement) {
                    timerElement.textContent = formatTime(activeGames[courtId].elapsedTime);
                }

                // Сохраняем состояние тренировки
                saveTrainingState();
            }, 1000);
        }
    }

    // Отображаем корты и очередь
    renderCourts();
    renderQueue();
}

// Отображение информации о тренировке
function displayTrainingInfo() {
    const trainingDate = new Date(`${currentTraining.date}T${currentTraining.time}`);
    const formattedDate = trainingDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    trainingInfoElement.innerHTML = `
        <p class="training-info-text">${currentTraining.location}, ${formattedDate}, ${currentTraining.time}</p>
    `;
}

// Инициализация кортов
function initCourts() {
    // Если в тренировке уже есть сохраненные данные о кортах, используем их
    if (currentTraining.courtsData && Array.isArray(currentTraining.courtsData)) {
        courtsData = currentTraining.courtsData;

        // Проверяем, что у всех кортов есть необходимые свойства
        courtsData.forEach(court => {
            // Если свойство winnerStayed не определено, устанавливаем его в false
            if (court.winnerStayed === undefined) {
                court.winnerStayed = false;
            }

            // Если свойство previousWinnersSide не определено, но winnerStayed = true,
            // устанавливаем его в 1 (по умолчанию)
            if (court.previousWinnersSide === undefined && court.winnerStayed) {
                court.previousWinnersSide = 1;
            }

            // Если свойство winnerChanges не определено, устанавливаем его в 0
            if (court.winnerChanges === undefined) {
                court.winnerChanges = 0;
            }
        });
    } else {
        // Иначе создаем новые корты
        courtsData = [];

        for (let i = 0; i < currentTraining.courts; i++) {
            courtsData.push({
                id: i,
                name: `Корт ${i + 1}`,
                side1: [],
                side2: [],
                winnerStayed: false,
                previousWinnersSide: null,
                winnerChanges: 0
            });
        }
    }
}

// Инициализация очереди игроков
function initQueue() {
    // Если в тренировке уже есть сохраненная очередь, используем ее
    if (currentTraining.queuePlayers && Array.isArray(currentTraining.queuePlayers)) {
        queuePlayers = currentTraining.queuePlayers;
    } else {
        // Иначе создаем очередь из всех игроков тренировки
        queuePlayers = [];

        if (currentTraining.playerIds && currentTraining.playerIds.length > 0) {
            currentTraining.playerIds.forEach(playerId => {
                const player = players.find((p, idx) => idx === playerId);
                if (player) {
                    queuePlayers.push({
                        id: playerId,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        photo: player.photo,
                        rating: player.rating
                    });
                }
            });
        }
    }
}

// Отображение кортов
function renderCourts() {
    courtsContainer.innerHTML = '';
    
    courtsData.forEach(court => {
        const courtCard = document.createElement('div');
        courtCard.classList.add('court-card');
        
        // Создаем HTML для игроков на стороне 1
        let side1PlayersHtml = '';
        if (court.side1.length > 0) {
            court.side1.forEach(player => {
                const photoSrc = player.photo || createInitialsAvatar(player.firstName, player.lastName);
                side1PlayersHtml += `
                    <div class="court-player">
                        <img src="${photoSrc}" alt="${player.firstName} ${player.lastName}" class="court-player-photo">
                        <div class="player-name-container">
                            <div>${player.firstName} ${player.lastName}</div>
                            <span class="remove-player" data-court="${court.id}" data-side="1" data-index="${court.side1.indexOf(player)}">&times;</span>
                        </div>
                    </div>
                `;
            });
        }

        // Создаем HTML для игроков на стороне 2
        let side2PlayersHtml = '';
        if (court.side2.length > 0) {
            court.side2.forEach(player => {
                const photoSrc = player.photo || createInitialsAvatar(player.firstName, player.lastName);
                side2PlayersHtml += `
                    <div class="court-player">
                        <img src="${photoSrc}" alt="${player.firstName} ${player.lastName}" class="court-player-photo">
                        <div class="player-name-container">
                            <div>${player.firstName} ${player.lastName}</div>
                            <span class="remove-player" data-court="${court.id}" data-side="2" data-index="${court.side2.indexOf(player)}">&times;</span>
                        </div>
                    </div>
                `;
            });
        }
        
        // Проверяем, играет ли пара вторую игру
        const secondGameIndicator = court.winnerStayed ?
            '<div class="second-game-indicator">2-я игра</div>' : '';

        courtCard.innerHTML = `
            <div class="court-header">
                <div class="court-title">${court.name}</div>
                ${secondGameIndicator}
            </div>
            <div class="court-sides">
                <div class="court-side side1">
                    <div class="court-players">
                        ${side1PlayersHtml}
                    </div>
                    <div class="court-buttons">
                        ${court.side1.length >= 2 ? '' : `
                        <button class="btn quick-add-btn ${queuePlayers.length === 0 ? 'disabled' : ''}"
                                data-court="${court.id}"
                                data-side="1"
                                ${queuePlayers.length === 0 ? 'disabled' : ''}>
                            Очередь
                        </button>
                        <button class="btn select-add-btn"
                                data-court="${court.id}"
                                data-side="1">
                            +
                        </button>
                        `}
                    </div>
                </div>
                <div class="court-side side2">
                    <div class="court-players">
                        ${side2PlayersHtml}
                    </div>
                    <div class="court-buttons">
                        ${court.side2.length >= 2 ? '' : `
                        <button class="btn quick-add-btn ${queuePlayers.length === 0 ? 'disabled' : ''}"
                                data-court="${court.id}"
                                data-side="2"
                                ${queuePlayers.length === 0 ? 'disabled' : ''}>
                            Очередь
                        </button>
                        <button class="btn select-add-btn"
                                data-court="${court.id}"
                                data-side="2">
                            +
                        </button>
                        `}
                    </div>
                </div>
            </div>
            <div class="court-actions">
                ${activeGames[court.id] ?
                    `<div class="game-timer" id="timer-${court.id}">${formatTime(activeGames[court.id].elapsedTime)}</div>
                    <div class="game-buttons">
                        <button class="btn finish-game-btn" data-court="${court.id}">Игра завершена</button>
                        <button class="btn cancel-game-btn" data-court="${court.id}">Отмена</button>
                    </div>` :
                    `<button class="btn start-game-btn" data-court="${court.id}">Начать</button>`
                }
            </div>
        `;
        
        courtsContainer.appendChild(courtCard);
    });
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court'));
            const side = parseInt(this.getAttribute('data-side'));
            addFirstPlayerFromQueue(courtId, side);
        });
    });

    document.querySelectorAll('.select-add-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court'));
            const side = parseInt(this.getAttribute('data-side'));
            showPlayerSelectionDialog(courtId, side);
        });
    });
    
    document.querySelectorAll('.start-game-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court'));
            startGame(courtId);
        });
    });

    document.querySelectorAll('.finish-game-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court'));
            finishGame(courtId);
        });
    });

    document.querySelectorAll('.cancel-game-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court'));
            cancelGame(courtId);
        });
    });

    // Добавляем обработчики для крестиков удаления игроков
    document.querySelectorAll('.remove-player').forEach(btn => {
        btn.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court'));
            const side = parseInt(this.getAttribute('data-side'));
            const playerIndex = parseInt(this.getAttribute('data-index'));
            removePlayerFromCourt(courtId, side, playerIndex);
        });
    });
}

// Отображение очереди игроков
function renderQueue() {
    playersQueue.innerHTML = '';
    
    queuePlayers.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.classList.add('queue-player');

        const photoSrc = player.photo || createInitialsAvatar(player.firstName, player.lastName);

        playerElement.innerHTML = `
            <img src="${photoSrc}" alt="${player.firstName} ${player.lastName}" class="queue-player-photo">
            <span class="queue-player-name">${player.firstName} ${player.lastName}</span>
        `;

        playersQueue.appendChild(playerElement);
    });
}

// Быстрое добавление первого игрока из очереди на корт
function addFirstPlayerFromQueue(courtId, side) {
    if (queuePlayers.length === 0) {
        alert('Нет доступных игроков в очереди');
        return;
    }

    // Проверяем, есть ли место на выбранной стороне корта
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    const sideArray = side === 1 ? court.side1 : court.side2;
    if (sideArray.length >= 2) {
        alert('На этой стороне уже максимальное количество игроков (2)');
        return;
    }

    // Берем первого игрока из очереди
    const player = queuePlayers[0];

    // Добавляем игрока на корт
    const success = addPlayerToCourt(courtId, side, player);

    if (success !== false) {
        // Удаляем игрока из очереди
        queuePlayers.splice(0, 1);

        // Обновляем отображение
        renderCourts();
        renderQueue();

        // Сохраняем состояние тренировки
        saveTrainingState();
    }
}

// Показать диалог выбора игрока для добавления на корт
function showPlayerSelectionDialog(courtId, side) {
    if (queuePlayers.length === 0) {
        alert('Нет доступных игроков в очереди');
        return;
    }

    // Проверяем, есть ли место на выбранной стороне корта
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    const sideArray = side === 1 ? court.side1 : court.side2;
    if (sideArray.length >= 2) {
        alert('На этой стороне уже максимальное количество игроков (2)');
        return;
    }

    // Создаем модальное окно для выбора игрока
    const modal = document.createElement('div');
    modal.classList.add('player-selection-modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('player-selection-modal-content');

    // Заголовок модального окна
    const modalHeader = document.createElement('div');
    modalHeader.classList.add('player-selection-modal-header');
    modalHeader.innerHTML = `
        <h3>Выберите игрока</h3>
        <span class="close-modal">&times;</span>
    `;

    // Список игроков
    const playersList = document.createElement('div');
    playersList.classList.add('player-selection-list');

    queuePlayers.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.classList.add('player-selection-item');

        const photoSrc = player.photo || createInitialsAvatar(player.firstName, player.lastName);

        playerItem.innerHTML = `
            <img src="${photoSrc}" alt="${player.firstName} ${player.lastName}" class="player-selection-photo">
            <span class="player-selection-name">${player.firstName} ${player.lastName}</span>
        `;

        // Добавляем обработчик клика для выбора игрока
        playerItem.addEventListener('click', function() {
            // Добавляем выбранного игрока на корт
            const success = addPlayerToCourt(courtId, side, player);

            if (success !== false) {
                // Удаляем игрока из очереди
                queuePlayers.splice(index, 1);

                // Обновляем отображение
                renderCourts();
                renderQueue();

                // Сохраняем состояние тренировки
                saveTrainingState();

                // Закрываем модальное окно
                document.body.removeChild(modal);
            }
        });

        playersList.appendChild(playerItem);
    });

    // Собираем модальное окно
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(playersList);
    modal.appendChild(modalContent);

    // Добавляем обработчик для закрытия модального окна
    const closeBtn = modalHeader.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    // Добавляем обработчик для закрытия модального окна при клике вне его
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Добавляем модальное окно в DOM
    document.body.appendChild(modal);
}

// Добавление игрока на корт
function addPlayerToCourt(courtId, side, player) {
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    // Проверяем, что на стороне не более 2 игроков
    if (side === 1) {
        if (court.side1.length >= 2) {
            alert('На этой стороне уже максимальное количество игроков (2)');
            return false;
        }
        court.side1.push(player);
    } else {
        if (court.side2.length >= 2) {
            alert('На этой стороне уже максимальное количество игроков (2)');
            return false;
        }
        court.side2.push(player);
    }

    return true;
}

// Удаление игрока с корта и возвращение его в очередь
function removePlayerFromCourt(courtId, side, playerIndex) {
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    let removedPlayer;

    // Удаляем игрока с корта
    if (side === 1) {
        if (playerIndex < 0 || playerIndex >= court.side1.length) return;
        removedPlayer = court.side1.splice(playerIndex, 1)[0];
    } else {
        if (playerIndex < 0 || playerIndex >= court.side2.length) return;
        removedPlayer = court.side2.splice(playerIndex, 1)[0];
    }

    // Добавляем игрока в начало очереди
    if (removedPlayer) {
        queuePlayers.unshift(removedPlayer);
    }

    // Обновляем отображение
    renderCourts();
    renderQueue();

    // Сохраняем состояние тренировки
    saveTrainingState();
}

// Начало игры на корте
function startGame(courtId) {
    // Проверяем, что на корте достаточно игроков
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    if (court.side1.length === 0 || court.side2.length === 0) {
        alert('Для начала игры должен быть хотя бы один игрок на каждой стороне корта');
        return;
    }

    // Создаем новую активную игру
    activeGames[courtId] = {
        startTime: Date.now(),
        elapsedTime: 0,
        timerId: null
    };

    // Запускаем таймер
    activeGames[courtId].timerId = setInterval(() => {
        activeGames[courtId].elapsedTime = Date.now() - activeGames[courtId].startTime;

        // Обновляем отображение таймера
        const timerElement = document.getElementById(`timer-${courtId}`);
        if (timerElement) {
            timerElement.textContent = formatTime(activeGames[courtId].elapsedTime);
        }

        // Сохраняем состояние тренировки
        saveTrainingState();
    }, 1000);

    // Обновляем отображение
    renderCourts();

    // Сохраняем состояние тренировки
    saveTrainingState();
}

// Завершение игры на корте
function finishGame(courtId) {
    // Проверяем, что игра активна
    if (!activeGames[courtId]) return;

    // Получаем корт
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    // Проверяем, что на корте есть игроки
    if (court.side1.length === 0 || court.side2.length === 0) {
        alert('На корте должны быть игроки с обеих сторон');
        return;
    }

    // Показываем модальное окно выбора победителя
    showWinnerSelectionDialog(courtId);
}

// Показать диалог выбора победителя
function showWinnerSelectionDialog(courtId) {
    // Получаем корт
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.classList.add('player-selection-modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('player-selection-modal-content');

    // Заголовок модального окна
    const modalHeader = document.createElement('div');
    modalHeader.classList.add('player-selection-modal-header');
    modalHeader.innerHTML = `
        <h3>Кто победил?</h3>
        <span class="close-modal">&times;</span>
    `;

    // Содержимое модального окна
    const modalBody = document.createElement('div');
    modalBody.classList.add('winner-selection-body');

    // Формируем названия команд (фамилии через косую черту)
    const side1Name = court.side1.map(player => player.lastName).join('/');
    const side2Name = court.side2.map(player => player.lastName).join('/');

    modalBody.innerHTML = `
        <div class="winner-option" data-court="${courtId}" data-winner="1">
            <div class="winner-team">${side1Name}</div>
        </div>
        <div class="winner-option" data-court="${courtId}" data-winner="2">
            <div class="winner-team">${side2Name}</div>
        </div>
        <div class="winner-buttons">
            <button class="btn cancel-winner-btn">Отмена</button>
        </div>
    `;

    // Собираем модальное окно
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);

    // Добавляем обработчики событий

    // Закрытие модального окна при клике на крестик
    const closeBtn = modalHeader.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    // Закрытие модального окна при клике вне его
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Обработчик для кнопки отмены
    const cancelBtn = modalBody.querySelector('.cancel-winner-btn');
    cancelBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    // Обработчики для выбора победителя
    const winnerOptions = modalBody.querySelectorAll('.winner-option');
    winnerOptions.forEach(option => {
        option.addEventListener('click', function() {
            const courtId = parseInt(this.getAttribute('data-court'));
            const winningSide = parseInt(this.getAttribute('data-winner'));

            // Завершаем игру с выбранным победителем
            completeGameWithWinner(courtId, winningSide);

            // Закрываем модальное окно
            document.body.removeChild(modal);
        });
    });

    // Добавляем модальное окно в DOM
    document.body.appendChild(modal);
}

// Завершение игры с выбранным победителем
function completeGameWithWinner(courtId, winningSide) {
    // Проверяем, что игра активна
    if (!activeGames[courtId]) return;

    // Останавливаем таймер
    clearInterval(activeGames[courtId].timerId);

    // Удаляем активную игру
    delete activeGames[courtId];

    // Получаем корт
    const court = courtsData.find(c => c.id === courtId);
    if (!court) return;

    // Применяем правила регламента с учетом победителя
    applyRegulationRules(court, winningSide);

    // Обновляем отображение
    renderCourts();
    renderQueue();

    // Сохраняем состояние тренировки
    saveTrainingState();
}

// Применение правил регламента после завершения игры
function applyRegulationRules(court, winningSide = 1) {
    const regulation = currentTraining.gameRegulation;

    // Если нет игроков на корте, нечего делать
    if (court.side1.length === 0 && court.side2.length === 0) return;

    // Определяем победителей и проигравших
    const winners = winningSide === 1 ? court.side1 : court.side2;
    const losers = winningSide === 1 ? court.side2 : court.side1;

    switch (regulation) {
        case 'two_games_out':
            // Победитель играет две игры
            if (court.winnerStayed) {
                // Это вторая игра для пары, которая выиграла первую игру

                // Проверяем, выиграла ли та же пара, что и в первой игре
                // Для этого смотрим, на какой стороне находятся игроки, которые остались с прошлой игры
                const previousWinnersSide = court.previousWinnersSide || 1;

                if (winningSide === previousWinnersSide) {
                    // Если победили те же игроки, что и в первой игре (выиграли обе игры)
                    // Сначала добавляем победителей в конец очереди
                    winners.forEach(player => {
                        queuePlayers.push(player);
                    });
                    // Затем добавляем проигравших в конец очереди
                    losers.forEach(player => {
                        queuePlayers.push(player);
                    });
                    // Очищаем корт
                    court.side1 = [];
                    court.side2 = [];
                    // Сбрасываем флаги
                    court.winnerStayed = false;
                    court.previousWinnersSide = null;
                    // Сбрасываем счетчик смен победителей
                    court.winnerChanges = 0;
                } else {
                    // Если победили новые игроки (предыдущие победители проиграли)

                    // Добавляем проигравших (предыдущих победителей) в конец очереди
                    losers.forEach(player => {
                        queuePlayers.push(player);
                    });

                    // Очищаем сторону проигравших и перемещаем новых победителей на сторону 1
                    if (winningSide === 1) {
                        court.side2 = [];
                    } else {
                        court.side1 = winners;
                        court.side2 = [];
                    }

                    // Устанавливаем флаг, что новые победители остаются для своей второй игры
                    court.winnerStayed = true;
                    // Запоминаем, на какой стороне находятся новые победители
                    court.previousWinnersSide = winningSide;
                    // Сбрасываем счетчик смен победителей, так как это новая пара
                    court.winnerChanges = 0;
                }
            } else {
                // Это первая игра для обеих пар
                // Добавляем проигравших в конец очереди
                losers.forEach(player => {
                    queuePlayers.push(player);
                });

                // Очищаем сторону проигравших и перемещаем победителей на сторону 1
                if (winningSide === 1) {
                    court.side2 = [];
                } else {
                    court.side1 = winners;
                    court.side2 = [];
                }

                // Устанавливаем флаг, что победитель остался
                court.winnerStayed = true;
                // Запоминаем, на какой стороне находятся победители
                court.previousWinnersSide = winningSide;
                // Сбрасываем счетчик смен победителей
                court.winnerChanges = 0;
            }
            break;

        case 'winner_stays_always':
            // Победитель остается всегда
            // Добавляем проигравших в конец очереди
            losers.forEach(player => {
                queuePlayers.push(player);
            });
            // Очищаем сторону проигравших
            if (winningSide === 1) {
                court.side2 = [];
            } else {
                court.side1 = [];
                // Перемещаем победителей на сторону 1
                court.side1 = winners;
                court.side2 = [];
            }
            break;

        case 'winner_stays_once':
            // Победитель остается один раз
            // Если у корта есть свойство winnerStayed и оно true,
            // значит победитель уже оставался один раз
            if (court.winnerStayed) {
                // Сначала добавляем победителей в конец очереди
                winners.forEach(player => {
                    queuePlayers.push(player);
                });
                // Затем добавляем проигравших в конец очереди
                losers.forEach(player => {
                    queuePlayers.push(player);
                });
                // Очищаем корт
                court.side1 = [];
                court.side2 = [];
                // Сбрасываем флаг
                court.winnerStayed = false;
            } else {
                // Добавляем проигравших в конец очереди
                losers.forEach(player => {
                    queuePlayers.push(player);
                });
                // Очищаем сторону проигравших и перемещаем победителей на сторону 1
                if (winningSide === 1) {
                    court.side2 = [];
                } else {
                    court.side1 = winners;
                    court.side2 = [];
                }
                // Устанавливаем флаг, что победитель остался
                court.winnerStayed = true;
            }
            break;

        case 'one_game':
            // Играем один раз
            // Сначала добавляем победителей в конец очереди
            winners.forEach(player => {
                queuePlayers.push(player);
            });
            // Затем добавляем проигравших в конец очереди
            losers.forEach(player => {
                queuePlayers.push(player);
            });
            // Очищаем корт
            court.side1 = [];
            court.side2 = [];
            break;
    }
}

// Отмена игры на корте (возврат к состоянию до начала игры)
function cancelGame(courtId) {
    // Проверяем, что игра активна
    if (!activeGames[courtId]) return;

    // Останавливаем таймер
    clearInterval(activeGames[courtId].timerId);

    // Удаляем активную игру
    delete activeGames[courtId];

    // Обновляем отображение
    renderCourts();

    // Сохраняем состояние тренировки
    saveTrainingState();
}

// Функция для сохранения состояния тренировки
function saveTrainingState() {
    // Подготовим данные об активных играх для сохранения (без таймеров)
    const activeGamesData = {};
    for (const courtId in activeGames) {
        activeGamesData[courtId] = {
            startTime: activeGames[courtId].startTime,
            elapsedTime: activeGames[courtId].elapsedTime
        };
    }

    // Сохраняем текущее состояние кортов, очереди и активных игр в объект тренировки
    currentTraining.courtsData = courtsData;
    currentTraining.queuePlayers = queuePlayers;
    currentTraining.activeGames = activeGamesData;

    // Обновляем тренировку в массиве тренировок
    trainings[trainingId] = currentTraining;

    // Сохраняем обновленный массив тренировок в localStorage
    localStorage.setItem('badmintonTrainings', JSON.stringify(trainings));
}

// Обработчик для кнопки возврата к списку тренировок
if (backToMainBtn) {
    console.log('Добавляем обработчик для кнопки возврата');

    // Удаляем все существующие обработчики
    backToMainBtn.removeEventListener('click', backToMainHandler);

    // Добавляем новый обработчик
    backToMainBtn.addEventListener('click', backToMainHandler);
}

// Функция-обработчик для кнопки возврата
function backToMainHandler() {
    console.log('Кнопка возврата нажата');

    // Сохраняем состояние тренировки перед выходом
    saveTrainingState();

    // Перенаправляем на главную страницу с параметром для открытия вкладки тренировок
    window.location.href = 'index.html?tab=trainings';
}

// Обработчик изменения регламента
gameRegulationSelect.addEventListener('change', function() {
    // Сохраняем выбранный регламент в объект тренировки
    currentTraining.gameRegulation = this.value;

    // Сохраняем состояние тренировки
    saveTrainingState();
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initTrainingSession();

    // Добавляем обработчик для кнопки возврата еще раз после загрузки DOM
    const backBtn = document.getElementById('back-to-main');
    if (backBtn) {
        console.log('Добавляем обработчик для кнопки возврата после загрузки DOM');
        backBtn.addEventListener('click', function() {
            console.log('Кнопка возврата нажата (DOM loaded)');
            saveTrainingState();
            window.location.href = 'index.html?tab=trainings';
        });
    } else {
        console.error('Кнопка возврата не найдена после загрузки DOM');
    }
});

// Сохраняем состояние тренировки и останавливаем таймеры при закрытии страницы или перезагрузке
window.addEventListener('beforeunload', function() {
    // Останавливаем все таймеры
    for (const courtId in activeGames) {
        if (activeGames[courtId].timerId) {
            clearInterval(activeGames[courtId].timerId);
        }
    }

    saveTrainingState();
});