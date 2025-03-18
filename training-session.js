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

// DOM элементы
const trainingInfoElement = document.getElementById('training-info');
const courtsContainer = document.getElementById('courts-container');
const playersQueue = document.getElementById('players-queue');
const backToMainBtn = document.getElementById('back-to-main');

// Создаем дефолтное изображение
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
    
    // Инициализируем корты
    initCourts();
    
    // Инициализируем очередь игроков
    initQueue();
    
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
        <p><strong>Место:</strong> ${currentTraining.location}</p>
        <p><strong>Дата и время:</strong> ${formattedDate}, ${currentTraining.time}</p>
        <p><strong>Количество кортов:</strong> ${currentTraining.courts}</p>
    `;
}

// Инициализация кортов
function initCourts() {
    // Если в тренировке уже есть сохраненные данные о кортах, используем их
    if (currentTraining.courtsData && Array.isArray(currentTraining.courtsData)) {
        courtsData = currentTraining.courtsData;
    } else {
        // Иначе создаем новые корты
        courtsData = [];

        for (let i = 0; i < currentTraining.courts; i++) {
            courtsData.push({
                id: i,
                name: `Корт ${i + 1}`,
                side1: [],
                side2: []
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
                const photoSrc = player.photo || defaultAvatarDataURL;
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
                const photoSrc = player.photo || defaultAvatarDataURL;
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
        
        courtCard.innerHTML = `
            <div class="court-header">
                <div class="court-title">${court.name}</div>
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
                <button class="btn start-game-btn" data-court="${court.id}">Начать</button>
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
        
        const photoSrc = player.photo || defaultAvatarDataURL;
        
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

        const photoSrc = player.photo || defaultAvatarDataURL;

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
    alert('Функционал начала игры будет добавлен в следующей версии');
}

// Функция для сохранения состояния тренировки
function saveTrainingState() {
    // Сохраняем текущее состояние кортов и очереди в объект тренировки
    currentTraining.courtsData = courtsData;
    currentTraining.queuePlayers = queuePlayers;

    // Обновляем тренировку в массиве тренировок
    trainings[trainingId] = currentTraining;

    // Сохраняем обновленный массив тренировок в localStorage
    localStorage.setItem('badmintonTrainings', JSON.stringify(trainings));
}

// Обработчик для кнопки возврата к списку тренировок
backToMainBtn.addEventListener('click', function() {
    // Сохраняем состояние тренировки перед выходом
    saveTrainingState();

    // Перенаправляем на главную страницу с параметром для открытия вкладки тренировок
    window.location.href = 'index.html?tab=trainings';
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initTrainingSession();
});

// Сохраняем состояние тренировки при закрытии страницы или перезагрузке
window.addEventListener('beforeunload', function() {
    saveTrainingState();
});