// Создаем дефолтное изображение
const defaultAvatarDataURL = createDefaultAvatar();

// Инициализация данных
let players = []; // Игроки будут загружаться из Firebase
let trainings = []; // Тренировки будут загружаться из Firebase
let currentSortMethod = 'name'; // По умолчанию сортировка по имени
let activeTab = 'players'; // По умолчанию активна вкладка игроков

// DOM элементы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addPlayerFirebaseBtn = document.getElementById('add-player-firebase-btn');
const addTrainingBtn = document.getElementById('add-training-btn');
const addPlayerToTrainingBtn = document.getElementById('add-player-to-training-btn');
const sortNameBtn = document.getElementById('sort-name-btn');
const sortRatingBtn = document.getElementById('sort-rating-btn');
const playerModal = document.getElementById('player-modal');
const playerFirebaseModal = document.getElementById('player-firebase-modal');
const trainingModal = document.getElementById('training-modal');
const closeBtns = document.querySelectorAll('.close-btn');
const playerForm = document.getElementById('player-form');
const playerFirebaseForm = document.getElementById('player-firebase-form');
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
        const originalIndex = players.findIndex(p => p.id === player.id);

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

// Функция для добавления игрока в Firebase
function addPlayerToFirebase(player) {
    // Проверяем, авторизован ли пользователь
    if (!firebase.auth().currentUser) {
        console.error("Ошибка: пользователь не авторизован");
        alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
        return Promise.reject(new Error("Пользователь не авторизован"));
    }

    // Добавляем информацию о создателе и времени создания
    const playerData = {
        ...player,
        createdAt: new Date().toISOString(),
        createdBy: firebase.auth().currentUser.uid
    };

    // Используем функцию addPlayerToAllPlayers из firebase-config.js
    if (typeof window.addPlayerToAllPlayers === 'function') {
        return window.addPlayerToAllPlayers(playerData)
            .then(playerId => {
                console.log("Игрок успешно добавлен в allPlayers с ID:", playerId);

                // После успешного добавления в Firebase, загружаем обновленный список игроков
                loadAndDisplayAllPlayers();

                return playerId;
            });
    } else {
        console.error("Функция addPlayerToAllPlayers не найдена");
        alert("Ошибка: функция для добавления игрока не найдена");
        return Promise.reject(new Error("Функция addPlayerToAllPlayers не найдена"));
    }
}

// Удаление игрока
function deletePlayer(index) {
    if (confirm('Вы уверены, что хотите удалить этого игрока?')) {
        console.log("Удаление игрока с индексом:", index);
        console.log("Текущий список игроков:", players);

        // Проверяем, авторизован ли пользователь
        if (!firebase.auth().currentUser) {
            console.error("Ошибка: пользователь не авторизован");
            alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
            return;
        }

        console.log("Пользователь авторизован:", firebase.auth().currentUser.email);

        // Проверяем, существует ли игрок с таким индексом
        if (index < 0 || index >= players.length) {
            console.error("Ошибка: неверный индекс игрока:", index);
            alert("Ошибка: неверный индекс игрока");
            return;
        }

        // Проверяем, есть ли у игрока id в Firebase
        const player = players[index];
        console.log("Игрок для удаления:", player);

        if (!player || !player.id) {
            console.error("Ошибка: у игрока нет ID в Firebase");
            alert("Ошибка: у игрока нет ID в Firebase");
            return;
        }

        console.log("ID игрока для удаления:", player.id);

        // Прямой вызов Firestore API для удаления игрока
        try {
            console.log("Прямой вызов Firestore API для удаления игрока с ID:", player.id);

            firebase.firestore().collection("allPlayers").doc(player.id).delete()
                .then(() => {
                    console.log("Игрок успешно удален из Firestore");
                    alert("Игрок успешно удален");

                    // Обновляем список игроков
                    loadAndDisplayAllPlayers();
                })
                .catch(error => {
                    console.error("Ошибка при удалении игрока из Firestore:", error);
                    alert(`Ошибка при удалении игрока: ${error.message}`);
                });
        } catch (error) {
            console.error("Исключение при удалении игрока из Firestore:", error);
            alert(`Исключение при удалении игрока: ${error.message}`);

            // Пробуем использовать функцию deletePlayerFromAllPlayers как запасной вариант
            if (typeof window.deletePlayerFromAllPlayers === 'function') {
                console.log("Пробуем использовать функцию deletePlayerFromAllPlayers");

                window.deletePlayerFromAllPlayers(player.id)
                    .then(() => {
                        console.log("Игрок успешно удален через deletePlayerFromAllPlayers");
                        alert("Игрок успешно удален");
                    })
                    .catch(error => {
                        console.error("Ошибка при удалении игрока через deletePlayerFromAllPlayers:", error);
                        alert(`Ошибка при удалении игрока: ${error.message}`);
                    });
            }
        }
    }
}

// Функции для обновления данных в памяти
function updatePlayersInMemory(newPlayers) {
    players = newPlayers;
    renderPlayers();
}

// Экспортируем функцию в глобальную область видимости для доступа из firebase-config.js
window.updatePlayersInMemory = updatePlayersInMemory;

function updateTrainingsInMemory(newTrainings) {
    trainings = newTrainings;
    renderTrainings();
}

// Экспортируем функцию в глобальную область видимости для доступа из firebase-config.js
window.updateTrainingsInMemory = updateTrainingsInMemory;

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
        // Проверяем, авторизован ли пользователь
        if (!firebase.auth().currentUser) {
            console.error("Ошибка: пользователь не авторизован");
            alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
            return;
        }

        // Проверяем, есть ли у тренировки id в Firebase
        const training = trainings[index];

        if (!training.id) {
            console.error("Ошибка: у тренировки нет ID в Firebase");
            alert("Ошибка: у тренировки нет ID в Firebase");
            return;
        }

        if (typeof window.deleteTrainingFromFirebase === 'function') {
            // Удаляем тренировку из Firebase
            window.deleteTrainingFromFirebase(training.id)
                .then(() => {
                    console.log("Тренировка успешно удалена из Firebase");
                    // Загрузка обновленного списка тренировок произойдет автоматически в функции deleteTrainingFromFirebase
                })
                .catch(error => {
                    console.error("Ошибка при удалении тренировки из Firebase:", error);
                    alert(`Ошибка при удалении тренировки: ${error.message}`);
                });
        } else {
            console.error("Функция deleteTrainingFromFirebase не найдена");
            alert("Ошибка: функция для удаления тренировки не найдена");
        }
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

    // Проверяем, авторизован ли пользователь
    if (!firebase.auth().currentUser) {
        alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
        return;
    }

    // Сбрасываем форму игрока
    playerFirebaseForm.reset();

    // Скрываем модальное окно тренировки и открываем модальное окно добавления игрока
    trainingModal.style.display = 'none';
    playerFirebaseModal.style.display = 'block';
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

// Обработка отправки формы редактирования игрока
playerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const rating = parseInt(document.getElementById('rating').value);
    const photoInput = document.getElementById('photo');
    const index = playerIndex.value ? parseInt(playerIndex.value) : null;

    // Проверяем, что это редактирование существующего игрока
    if (index === null) {
        alert("Ошибка: индекс игрока не указан");
        return;
    }

    // Проверяем, авторизован ли пользователь
    if (!firebase.auth().currentUser) {
        console.error("Ошибка: пользователь не авторизован");
        alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
        return;
    }

    // Проверяем, есть ли у игрока id в Firebase
    const player = players[index];
    if (!player.id) {
        console.error("Ошибка: у игрока нет ID в Firebase");
        alert("Ошибка: у игрока нет ID в Firebase");
        return;
    }

    // Функция для сохранения игрока
    const savePlayerData = (photoData) => {
        const playerData = {
            id: player.id,
            firstName,
            lastName,
            rating,
            photo: photoData
        };

        console.log("Редактируем игрока:", playerData);

        // Обновляем игрока в Firebase
        if (typeof window.savePlayer === 'function') {
            console.log("Обновляем игрока в Firebase с ID:", playerData.id);

            window.savePlayer(playerData)
                .then(playerId => {
                    console.log("Игрок успешно обновлен в Firebase с ID:", playerId);
                    alert("Игрок успешно обновлен!");

                    // Загружаем обновленный список игроков
                    loadAndDisplayAllPlayers();

                    // Закрываем модальное окно
                    closeModal(playerModal);
                })
                .catch(error => {
                    console.error("Ошибка при обновлении игрока в Firebase:", error);
                    alert(`Ошибка при обновлении игрока: ${error.message}`);
                });
        } else {
            console.error("Функция savePlayer не найдена");
            alert("Ошибка: функция для обновления игрока не найдена");
        }
    };

    // Обработка фото, если оно выбрано
    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            savePlayerData(e.target.result);
        };

        reader.readAsDataURL(photoInput.files[0]);
    } else {
        // Если фото не выбрано при редактировании, сохраняем текущее фото
        savePlayerData(player.photo);
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

    // Проверяем, авторизован ли пользователь
    if (!firebase.auth().currentUser) {
        console.error("Ошибка: пользователь не авторизован");
        alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
        return;
    }

    // Если это редактирование существующей тренировки, добавляем id
    if (index !== null && trainings[index].id) {
        trainingData.id = trainings[index].id;
    }

    // Используем функцию saveTraining из firebase-config.js
    if (typeof window.saveTraining === 'function') {
        window.saveTraining(trainingData)
            .then(trainingId => {
                console.log("Тренировка успешно сохранена в Firebase с ID:", trainingId);
                alert("Тренировка успешно сохранена!");
                closeModal(trainingModal);
            })
            .catch(error => {
                console.error("Ошибка при сохранении тренировки в Firebase:", error);
                alert(`Ошибка при сохранении тренировки: ${error.message}`);
            });
    } else {
        console.error("Функция saveTraining не найдена");
        alert("Ошибка: функция для сохранения тренировки не найдена");
    }
});

// Открытие модального окна для добавления игрока
addPlayerFirebaseBtn.addEventListener('click', function() {
    console.log("Нажата кнопка 'Добавить игрока'");

    // Проверяем, авторизован ли пользователь
    if (!firebase.auth().currentUser) {
        console.log("Пользователь не авторизован");
        alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
        return;
    }

    console.log("Пользователь авторизован:", firebase.auth().currentUser.email);

    // Проверяем, существует ли форма
    if (!playerFirebaseForm) {
        console.error("Форма playerFirebaseForm не найдена");
        alert("Ошибка: форма не найдена");
        return;
    }

    console.log("Форма найдена, сбрасываем");
    // Сбрасываем форму
    playerFirebaseForm.reset();

    // Проверяем, существует ли модальное окно
    if (!playerFirebaseModal) {
        console.error("Модальное окно playerFirebaseModal не найдено");
        alert("Ошибка: модальное окно не найдено");
        return;
    }

    console.log("Открываем модальное окно");
    // Открываем модальное окно
    playerFirebaseModal.style.display = 'block';
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
    console.log("Вызвана функция closeModal для модального окна:", modal ? modal.id : "undefined");

    if (!modal) {
        console.error("Ошибка: модальное окно не определено");
        return;
    }

    modal.style.display = 'none';
    console.log("Модальное окно закрыто");
}

// Функция для инициализации обработчиков кнопок закрытия
function initCloseButtons() {
    console.log("Инициализация кнопок закрытия");
    const closeBtns = document.querySelectorAll('.close-btn');
    console.log("Найдено кнопок закрытия:", closeBtns.length);

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log("Нажата кнопка закрытия");
            const modal = this.closest('.modal');
            console.log("Закрываем модальное окно:", modal.id);
            closeModal(modal);
        });
    });
}

// Закрытие модальных окон при клике вне их
window.addEventListener('click', function(e) {
    console.log("Клик по окну, target:", e.target);

    if (e.target === playerModal) {
        console.log("Клик по playerModal");
        closeModal(playerModal);
    } else if (e.target === trainingModal) {
        console.log("Клик по trainingModal");
        closeModal(trainingModal);
    } else if (e.target === playerFirebaseModal) {
        console.log("Клик по playerFirebaseModal");
        closeModal(playerFirebaseModal);
    }
});

// Функция для инициализации обработчика формы добавления игрока в Firebase
function initPlayerFirebaseForm() {
    console.log("Инициализация формы добавления игрока в Firebase");

    if (!playerFirebaseForm) {
        console.error("Форма playerFirebaseForm не найдена при инициализации");
        return;
    }

    playerFirebaseForm.addEventListener('submit', function(e) {
        console.log("Отправка формы добавления игрока в Firebase");
        e.preventDefault();

        // Проверяем, авторизован ли пользователь
        if (!firebase.auth().currentUser) {
            console.log("Пользователь не авторизован при отправке формы");
            alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
            return;
        }

        console.log("Получаем данные из формы");
        const firstName = document.getElementById('firebase-first-name').value;
        const lastName = document.getElementById('firebase-last-name').value;
        const rating = parseInt(document.getElementById('firebase-rating').value);

        console.log("Данные формы:", { firstName, lastName, rating });

        const playerData = {
            firstName,
            lastName,
            rating
        };

        console.log("Подготовленные данные игрока:", playerData);

        // Добавляем игрока в Firebase
        addPlayerToFirebase(playerData)
            .then(playerId => {
                console.log("Игрок успешно добавлен с ID:", playerId);
                alert(`Игрок ${firstName} ${lastName} успешно добавлен в базу данных!`);

                // Если игрок был создан из формы тренировки, добавляем его в тренировку
                if (currentTrainingData) {
                    console.log("Игрок был создан из формы тренировки");

                    // Загружаем обновленный список игроков и находим индекс нового игрока
                    loadAndDisplayAllPlayers()
                        .then(allPlayers => {
                            const newPlayer = allPlayers.find(p => p.id === playerId);
                            const newPlayerIndex = allPlayers.indexOf(newPlayer);

                            if (newPlayerIndex !== -1) {
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
                                closeModal(playerFirebaseModal);
                                trainingModal.style.display = 'block';
                            } else {
                                console.error("Не удалось найти добавленного игрока в списке");
                                alert("Ошибка: не удалось найти добавленного игрока в списке");

                                // Просто закрываем модальное окно игрока
                                closeModal(playerFirebaseModal);
                            }
                        });
                } else {
                    // Просто закрываем модальное окно игрока
                    closeModal(playerFirebaseModal);
                }
            })
            .catch(error => {
                console.error("Ошибка при добавлении игрока:", error);
                alert(`Ошибка при добавлении игрока: ${error.message}`);
            });
    });

    console.log("Обработчик формы добавления игрока в Firebase инициализирован");
}



// Функция для загрузки и отображения игроков из коллекции allPlayers
function loadAndDisplayAllPlayers() {
    console.log("Вызвана функция loadAndDisplayAllPlayers");

    // Проверяем, авторизован ли пользователь
    if (!firebase.auth().currentUser) {
        console.error("Ошибка: пользователь не авторизован в loadAndDisplayAllPlayers");
        return Promise.reject(new Error("Пользователь не авторизован"));
    }

    console.log("Пользователь авторизован:", firebase.auth().currentUser.email);

    // Проверяем доступность функции loadAllPlayers
    console.log("Проверка доступности функции loadAllPlayers:", typeof window.loadAllPlayers);

    // Используем функцию loadAllPlayers из firebase-config.js
    if (typeof window.loadAllPlayers === 'function') {
        console.log("Вызываем функцию loadAllPlayers");

        return window.loadAllPlayers()
            .then(allPlayers => {
                console.log("Загружено игроков из allPlayers:", allPlayers.length);

                // Обновляем список игроков в памяти
                console.log("Обновляем список игроков в памяти");
                updatePlayersInMemory(allPlayers);

                return allPlayers;
            })
            .catch(error => {
                console.error("Ошибка при загрузке игроков из allPlayers:", error);
                alert(`Ошибка при загрузке игроков: ${error.message}`);
                return [];
            });
    } else {
        console.error("Функция loadAllPlayers не найдена");
        alert("Функция loadAllPlayers не найдена. Проверьте консоль для деталей.");
        return Promise.resolve([]);
    }
}

// Открытие модального окна для добавления игрока
function openAddPlayerModal() {
    console.log("Вызвана функция openAddPlayerModal");

    // Проверяем, авторизован ли пользователь
    if (!firebase.auth().currentUser) {
        console.log("Пользователь не авторизован");
        alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
        return;
    }

    console.log("Пользователь авторизован:", firebase.auth().currentUser.email);

    // Проверяем, существует ли форма
    if (!playerFirebaseForm) {
        console.error("Форма playerFirebaseForm не найдена");
        alert("Ошибка: форма не найдена");
        return;
    }

    console.log("Форма найдена, сбрасываем");
    // Сбрасываем форму
    playerFirebaseForm.reset();

    // Проверяем, существует ли модальное окно
    if (!playerFirebaseModal) {
        console.error("Модальное окно playerFirebaseModal не найдено");
        alert("Ошибка: модальное окно не найдено");
        return;
    }

    console.log("Открываем модальное окно");
    // Открываем модальное окно
    playerFirebaseModal.style.display = 'block';
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM полностью загружен");

    // Инициализация обработчиков кнопок закрытия
    initCloseButtons();

    // Инициализация формы добавления игрока в Firebase
    initPlayerFirebaseForm();

    // Добавляем обработчик для кнопки "Добавить игрока"
    if (addPlayerFirebaseBtn) {
        console.log("Добавляем обработчик для кнопки 'Добавить игрока'");
        addPlayerFirebaseBtn.addEventListener('click', openAddPlayerModal);
    } else {
        console.error("Кнопка 'Добавить игрока' не найдена");
    }

    // Проверяем, есть ли параметр tab в URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');

    // Если параметр tab указан и это допустимая вкладка, используем его
    if (tabParam && (tabParam === 'players' || tabParam === 'trainings')) {
        activeTab = tabParam;
    }

    // Инициализация вкладок
    switchTab(activeTab);

    // Проверяем состояние аутентификации
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // Пользователь вошел в систему
            console.log("Пользователь вошел:", user);

            // Отображаем имя пользователя
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = user.displayName || user.email;
            }

            // Скрываем экран входа
            hideLoginScreen();

            // Загружаем данные пользователя
            loadUserData();

            // Загружаем игроков из коллекции allPlayers
            loadAndDisplayAllPlayers()
                .then(allPlayers => {
                    console.log("Успешно загружены игроки из allPlayers:", allPlayers.length);
                })
                .catch(error => {
                    console.error("Ошибка при инициализации загрузки игроков:", error);
                });
        } else {
            // Пользователь вышел из системы
            console.log("Пользователь вышел");

            // Показываем экран входа
            showLoginScreen();
        }
    });
});