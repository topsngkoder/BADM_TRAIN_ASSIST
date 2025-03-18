// Создаем дефолтное изображение
const defaultAvatarDataURL = createDefaultAvatar();

// Инициализация данных
let players = JSON.parse(localStorage.getItem('badmintonPlayers')) || [];
let trainings = JSON.parse(localStorage.getItem('badmintonTrainings')) || [];
let currentSortMethod = 'name'; // По умолчанию сортировка по имени
let activeTab = 'players'; // По умолчанию активна вкладка игроков

// DOM элементы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addPlayerBtn = document.getElementById('add-player-btn');
const addTrainingBtn = document.getElementById('add-training-btn');
const addPlayerToTrainingBtn = document.getElementById('add-player-to-training-btn');
const sortNameBtn = document.getElementById('sort-name-btn');
const sortRatingBtn = document.getElementById('sort-rating-btn');
const playerModal = document.getElementById('player-modal');
const trainingModal = document.getElementById('training-modal');
const closeBtns = document.querySelectorAll('.close-btn');
const playerForm = document.getElementById('player-form');
const trainingForm = document.getElementById('training-form');
const playersList = document.getElementById('players-list');
const trainingsList = document.getElementById('trainings-list');
const modalTitle = document.getElementById('modal-title');
const trainingModalTitle = document.getElementById('training-modal-title');
const playerIndex = document.getElementById('player-index');
const trainingIndex = document.getElementById('training-index');
const currentPhotoContainer = document.getElementById('current-photo-container');
const currentPhoto = document.getElementById('current-photo');
const trainingPlayersSelection = document.getElementById('training-players-selection');

// Переменная для хранения информации о текущей тренировке при создании игрока
let currentTrainingData = null;

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

// Функция для создания дефолтного аватара для случаев, когда нет имени и фамилии
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

// Отображение списка игроков
function renderPlayers() {
    playersList.innerHTML = '';

    if (players.length === 0) {
        playersList.innerHTML = '<p class="no-players">Нет добавленных игроков</p>';
        return;
    }

    // Сортировка игроков
    const sortedPlayers = [...players];
    if (currentSortMethod === 'name') {
        sortedPlayers.sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
    } else if (currentSortMethod === 'rating') {
        sortedPlayers.sort((a, b) => b.rating - a.rating);
    }

    sortedPlayers.forEach((player, sortedIndex) => {
        // Находим оригинальный индекс игрока в массиве players
        const originalIndex = players.findIndex(p =>
            p.firstName === player.firstName &&
            p.lastName === player.lastName &&
            p.rating === player.rating
        );

        const playerCard = document.createElement('div');
        playerCard.classList.add('player-card');

        const photoSrc = player.photo || createInitialsAvatar(player.firstName, player.lastName);

        playerCard.innerHTML = `
            <div class="player-card-content">
                <div class="player-info">
                    <h3>${player.firstName} ${player.lastName}</h3>
                    <p class="player-rating">Рейтинг: ${player.rating}</p>
                    <div class="player-actions">
                        <button class="btn edit-btn" data-index="${originalIndex}">Редактировать</button>
                        <button class="btn delete-btn" data-index="${originalIndex}">Удалить</button>
                    </div>
                </div>
                <div class="player-photo-container">
                    <img src="${photoSrc}" alt="${player.firstName} ${player.lastName}" class="player-photo">
                </div>
            </div>
        `;

        playersList.appendChild(playerCard);
    });

    // Добавляем обработчики для кнопок
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deletePlayer(index);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            openEditPlayerModal(index);
        });
    });
}

// Добавление нового игрока
function addPlayer(player) {
    players.push(player);
    savePlayersToLocalStorage();
    renderPlayers();
}

// Удаление игрока
function deletePlayer(index) {
    if (confirm('Вы уверены, что хотите удалить этого игрока?')) {
        players.splice(index, 1);
        savePlayersToLocalStorage();
        renderPlayers();
    }
}

// Сохранение данных в localStorage
function savePlayersToLocalStorage() {
    localStorage.setItem('badmintonPlayers', JSON.stringify(players));
}

function saveTrainingsToLocalStorage() {
    localStorage.setItem('badmintonTrainings', JSON.stringify(trainings));
}

// Переключение вкладок
function switchTab(tabName) {
    activeTab = tabName;

    // Обновляем активные кнопки вкладок
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    // Обновляем видимость контента вкладок
    tabContents.forEach(content => {
        const isActive = content.id === `${tabName}-tab`;
        content.classList.toggle('active', isActive);
    });
}

// Отображение списка тренировок
function renderTrainings() {
    trainingsList.innerHTML = '';

    if (trainings.length === 0) {
        trainingsList.innerHTML = '<p class="no-players">Нет созданных тренировок</p>';
        return;
    }

    // Сортировка тренировок по дате (сначала новые)
    const sortedTrainings = [...trainings].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB - dateA;
    });

    sortedTrainings.forEach((training, index) => {
        const trainingCard = document.createElement('div');
        trainingCard.classList.add('training-card');

        // Форматирование даты
        const trainingDate = new Date(`${training.date}T${training.time}`);
        const formattedDate = trainingDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = training.time;

        // Создаем HTML для списка игроков
        let playersHtml = '';
        if (training.playerIds && training.playerIds.length > 0) {
            training.playerIds.forEach(playerId => {
                const player = players.find((p, idx) => idx === playerId);
                if (player) {
                    const photoSrc = player.photo || createInitialsAvatar(player.firstName, player.lastName);
                    playersHtml += `
                        <div class="training-player-item">
                            <img src="${photoSrc}" alt="${player.firstName} ${player.lastName}" class="training-player-photo">
                            <div>${player.firstName} ${player.lastName}</div>
                        </div>
                    `;
                }
            });
        } else {
            playersHtml = '<p>Нет участников</p>';
        }

        trainingCard.innerHTML = `
            <div class="training-header">
                <div class="training-date-time">${formattedDate}, ${formattedTime}</div>
                <div class="training-actions">
                    <button class="btn icon-btn transparent-btn" data-index="${index}" title="Редактировать">✏️</button>
                    <button class="btn icon-btn transparent-btn" data-index="${index}" title="Удалить">🗑️</button>
                </div>
            </div>
            <div class="training-info">
                <div class="training-details">
                    <div class="training-location">
                        <strong>Место:</strong> ${training.location}
                    </div>
                    <div class="training-courts">
                        <strong>Количество кортов:</strong> ${training.courts}
                    </div>
                </div>
                <button class="btn start-training-btn" data-index="${index}">Войти</button>
            </div>
            <div class="training-players-title">Участники (${training.playerIds ? training.playerIds.length : 0}):</div>
            <div class="training-players">
                ${playersHtml}
            </div>
        `;

        trainingsList.appendChild(trainingCard);
    });

    // Добавляем обработчики для кнопок
    document.querySelectorAll('.trainings-list .training-actions button').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (this.textContent.includes('✏️')) {
                openEditTrainingModal(index);
            } else if (this.textContent.includes('🗑️')) {
                deleteTraining(index);
            }
        });
    });

    document.querySelectorAll('.trainings-list .start-training-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            window.location.href = `training-session.html?id=${index}`;
        });
    });
}

// Удаление тренировки
function deleteTraining(index) {
    if (confirm('Вы уверены, что хотите удалить эту тренировку?')) {
        trainings.splice(index, 1);
        saveTrainingsToLocalStorage();
        renderTrainings();
    }
}

// Открытие модального окна для редактирования тренировки
function openEditTrainingModal(index) {
    const training = trainings[index];

    // Заполняем форму данными тренировки
    document.getElementById('training-location').value = training.location;
    document.getElementById('training-date').value = training.date;
    document.getElementById('training-time').value = training.time;
    document.getElementById('training-courts').value = training.courts;
    trainingIndex.value = index;

    // Сохраняем данные текущей тренировки
    currentTrainingData = {
        index: index,
        location: training.location,
        date: training.date,
        time: training.time,
        courts: training.courts,
        playerIds: training.playerIds || []
    };

    // Заполняем список игроков
    fillTrainingPlayersSelection(training.playerIds || []);

    // Меняем заголовок модального окна
    trainingModalTitle.textContent = 'Редактировать тренировку';

    // Открываем модальное окно
    trainingModal.style.display = 'block';
}

// Открытие модального окна для создания игрока из формы тренировки
function openAddPlayerFromTrainingModal() {
    // Сохраняем данные текущей тренировки
    currentTrainingData = {
        index: trainingIndex.value ? parseInt(trainingIndex.value) : null,
        location: document.getElementById('training-location').value,
        date: document.getElementById('training-date').value,
        time: document.getElementById('training-time').value,
        courts: parseInt(document.getElementById('training-courts').value),
        playerIds: Array.from(document.querySelectorAll('input[name="selected-players"]:checked'))
            .map(checkbox => parseInt(checkbox.value))
    };

    // Сбрасываем форму игрока и скрываем контейнер с текущим фото
    playerForm.reset();
    playerIndex.value = '';
    currentPhotoContainer.style.display = 'none';

    // Меняем заголовок модального окна
    modalTitle.textContent = 'Добавить игрока';

    // Скрываем модальное окно тренировки и открываем модальное окно игрока
    trainingModal.style.display = 'none';
    playerModal.style.display = 'block';
}

// Заполнение списка игроков для выбора в тренировку
function fillTrainingPlayersSelection(selectedPlayerIds = []) {
    trainingPlayersSelection.innerHTML = '';

    if (players.length === 0) {
        trainingPlayersSelection.innerHTML = '<p>Нет доступных игроков</p>';
        return;
    }

    players.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.classList.add('player-checkbox-item');

        const photoSrc = player.photo || createInitialsAvatar(player.firstName, player.lastName);
        const isChecked = selectedPlayerIds.includes(index);

        playerItem.innerHTML = `
            <input type="checkbox" id="player-${index}" name="selected-players" value="${index}" ${isChecked ? 'checked' : ''}>
            <img src="${photoSrc}" alt="${player.firstName} ${player.lastName}" class="player-checkbox-photo">
            <div class="player-checkbox-info">
                <label for="player-${index}">${player.firstName} ${player.lastName} (Рейтинг: ${player.rating})</label>
            </div>
        `;

        trainingPlayersSelection.appendChild(playerItem);
    });
}

// Открытие модального окна для редактирования игрока
function openEditPlayerModal(index) {
    const player = players[index];

    // Заполняем форму данными игрока
    document.getElementById('first-name').value = player.firstName;
    document.getElementById('last-name').value = player.lastName;
    document.getElementById('rating').value = player.rating;
    playerIndex.value = index;

    // Отображаем текущее фото, если оно есть
    if (player.photo) {
        currentPhotoContainer.style.display = 'block';
        currentPhoto.src = player.photo;
    } else {
        currentPhotoContainer.style.display = 'none';
    }

    // Меняем заголовок модального окна
    modalTitle.textContent = 'Редактировать игрока';

    // Открываем модальное окно
    playerModal.style.display = 'block';
}

// Обработка отправки формы игрока
playerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const rating = parseInt(document.getElementById('rating').value);
    const photoInput = document.getElementById('photo');
    const index = playerIndex.value ? parseInt(playerIndex.value) : null;

    // Функция для сохранения игрока
    const savePlayer = (photoData) => {
        const playerData = {
            firstName,
            lastName,
            rating,
            photo: photoData
        };

        let newPlayerIndex;

        if (index !== null) {
            // Редактирование существующего игрока
            players[index] = playerData;
            newPlayerIndex = index;
        } else {
            // Добавление нового игрока
            players.push(playerData);
            newPlayerIndex = players.length - 1;
        }

        savePlayersToLocalStorage();
        renderPlayers();

        // Если игрок был создан из формы тренировки, добавляем его в тренировку
        if (currentTrainingData) {
            // Добавляем нового игрока в список выбранных игроков
            if (!currentTrainingData.playerIds.includes(newPlayerIndex)) {
                currentTrainingData.playerIds.push(newPlayerIndex);
            }

            // Восстанавливаем форму тренировки
            if (currentTrainingData.index !== null) {
                trainingIndex.value = currentTrainingData.index;
            } else {
                trainingIndex.value = '';
            }

            document.getElementById('training-location').value = currentTrainingData.location;
            document.getElementById('training-date').value = currentTrainingData.date;
            document.getElementById('training-time').value = currentTrainingData.time;
            document.getElementById('training-courts').value = currentTrainingData.courts;

            // Обновляем список игроков в форме тренировки
            fillTrainingPlayersSelection(currentTrainingData.playerIds);

            // Сбрасываем текущую тренировку
            currentTrainingData = null;

            // Закрываем модальное окно игрока и открываем модальное окно тренировки
            closeModal(playerModal);
            trainingModal.style.display = 'block';
        } else {
            // Просто закрываем модальное окно игрока
            closeModal(playerModal);
        }
    };

    // Обработка фото, если оно выбрано
    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            savePlayer(e.target.result);
        };

        reader.readAsDataURL(photoInput.files[0]);
    } else {
        // Если фото не выбрано при создании нового игрока
        if (index === null) {
            savePlayer(null);
        } else {
            // Если фото не выбрано при редактировании, сохраняем текущее фото
            savePlayer(players[index].photo);
        }
    }
});

// Обработка отправки формы тренировки
trainingForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const location = document.getElementById('training-location').value;
    const date = document.getElementById('training-date').value;
    const time = document.getElementById('training-time').value;
    const courts = parseInt(document.getElementById('training-courts').value);
    const index = trainingIndex.value ? parseInt(trainingIndex.value) : null;

    // Получаем выбранных игроков
    const selectedPlayerIds = Array.from(document.querySelectorAll('input[name="selected-players"]:checked'))
        .map(checkbox => parseInt(checkbox.value));

    const trainingData = {
        location,
        date,
        time,
        courts,
        playerIds: selectedPlayerIds
    };

    if (index !== null) {
        // Редактирование существующей тренировки
        trainings[index] = trainingData;
    } else {
        // Добавление новой тренировки
        trainings.push(trainingData);
    }

    saveTrainingsToLocalStorage();
    renderTrainings();
    closeModal(trainingModal);
});

// Открытие модального окна для добавления игрока
addPlayerBtn.addEventListener('click', function() {
    // Сбрасываем форму и скрываем контейнер с текущим фото
    playerForm.reset();
    playerIndex.value = '';
    currentPhotoContainer.style.display = 'none';

    // Меняем заголовок модального окна
    modalTitle.textContent = 'Добавить игрока';

    // Открываем модальное окно
    playerModal.style.display = 'block';
});

// Открытие модального окна для создания тренировки
addTrainingBtn.addEventListener('click', function() {
    // Сбрасываем форму
    trainingForm.reset();
    trainingIndex.value = '';

    // Устанавливаем текущую дату и время по умолчанию
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    document.getElementById('training-date').value = dateString;
    document.getElementById('training-time').value = timeString;

    // Заполняем список игроков
    fillTrainingPlayersSelection();

    // Меняем заголовок модального окна
    trainingModalTitle.textContent = 'Создать тренировку';

    // Открываем модальное окно
    trainingModal.style.display = 'block';
});

// Обработчик для кнопки "Создать нового игрока" в форме тренировки
addPlayerToTrainingBtn.addEventListener('click', function() {
    openAddPlayerFromTrainingModal();
});

// Обработчики для кнопок вкладок
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        switchTab(tabName);
    });
});

// Обработчики для кнопок сортировки
sortNameBtn.addEventListener('click', function() {
    currentSortMethod = 'name';
    updateSortButtons();
    renderPlayers();
});

sortRatingBtn.addEventListener('click', function() {
    currentSortMethod = 'rating';
    updateSortButtons();
    renderPlayers();
});

// Обновление стилей кнопок сортировки
function updateSortButtons() {
    sortNameBtn.classList.toggle('active', currentSortMethod === 'name');
    sortRatingBtn.classList.toggle('active', currentSortMethod === 'rating');
}

// Закрытие модального окна
function closeModal(modal) {
    modal.style.display = 'none';
}

// Добавляем обработчики для всех кнопок закрытия
closeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
    });
});

// Закрытие модальных окон при клике вне их
window.addEventListener('click', function(e) {
    if (e.target === playerModal) {
        closeModal(playerModal);
    } else if (e.target === trainingModal) {
        closeModal(trainingModal);
    }
});

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли параметр tab в URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');

    // Если параметр tab указан и это допустимая вкладка, используем его
    if (tabParam && (tabParam === 'players' || tabParam === 'trainings')) {
        activeTab = tabParam;
    }

    // Инициализация вкладок
    switchTab(activeTab);

    // Рендеринг данных
    renderPlayers();
    renderTrainings();
    updateSortButtons();
});