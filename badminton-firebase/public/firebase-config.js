// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyCfE99OnEQEkcBNPDuVup4ZIWR1qrnxUKE",
  authDomain: "training-assistant-c445e.firebaseapp.com",
  projectId: "training-assistant-c445e",
  storageBucket: "training-assistant-c445e.appspot.com",
  messagingSenderId: "368691580828",
  appId: "1:368691580828:web:bc26705765a4f16c1cc259"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Получение ссылок на сервисы Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Настройка аутентификации через Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Функция для входа через Google
function signInWithGoogle() {
  auth.signInWithPopup(googleProvider)
    .then((result) => {
      // Успешный вход
      console.log("Вход выполнен успешно:", result.user);
      // Загружаем данные пользователя
      loadUserData();
    })
    .catch((error) => {
      // Ошибка входа
      console.error("Ошибка входа:", error);
      alert(`Ошибка входа: ${error.message}`);
    });
}

// Функция для выхода из аккаунта
function signOut() {
  auth.signOut()
    .then(() => {
      console.log("Выход выполнен успешно");
      // Очищаем данные пользователя
      clearUserData();
      // Показываем экран входа
      showLoginScreen();
    })
    .catch((error) => {
      console.error("Ошибка выхода:", error);
    });
}

// Слушатель изменения состояния аутентификации
auth.onAuthStateChanged((user) => {
  if (user) {
    // Пользователь вошел в систему
    console.log("Пользователь вошел:", user);
    // Скрываем экран входа
    hideLoginScreen();
    // Загружаем данные пользователя
    loadUserData();
  } else {
    // Пользователь вышел из системы
    console.log("Пользователь вышел");
    // Показываем экран входа
    showLoginScreen();
  }
});

// Функция для загрузки данных пользователя
function loadUserData() {
  const user = auth.currentUser;
  if (!user) return;

  // Загружаем тренировки пользователя
  loadUserTrainings();

  // Загружаем игроков из коллекции allPlayers
  if (typeof window.loadAllPlayers === 'function') {
    window.loadAllPlayers()
      .then(allPlayers => {
        console.log("Загружено игроков из allPlayers:", allPlayers.length);

        // Обновляем UI через глобальную функцию
        if (typeof window.updatePlayersInMemory === 'function') {
          window.updatePlayersInMemory(allPlayers);
        } else if (typeof renderPlayers === 'function') {
          // Для совместимости со старым кодом
          window.players = allPlayers;
          renderPlayers();
        }
      })
      .catch(error => {
        console.error("Ошибка загрузки игроков из allPlayers:", error);
        alert("Ошибка загрузки игроков: " + error.message);
      });
  } else {
    console.error("Функция loadAllPlayers не найдена");
    alert("Ошибка: функция loadAllPlayers не найдена");
  }
}

// Функция для загрузки тренировок пользователя
function loadUserTrainings() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("trainings")
    .where("userId", "==", user.uid)
    .get()
    .then((querySnapshot) => {
      const trainings = [];
      querySnapshot.forEach((doc) => {
        trainings.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Обновляем UI через глобальную функцию
      if (typeof window.updateTrainingsInMemory === 'function') {
        window.updateTrainingsInMemory(trainings);
      } else if (typeof renderTrainings === "function") {
        // Для совместимости со старым кодом
        window.trainings = trainings;
        renderTrainings();
      }
    })
    .catch((error) => {
      console.error("Ошибка загрузки тренировок:", error);
    });
}

// Функция для загрузки общего списка игроков (устаревшая, оставлена для совместимости)
// Экспортируем в глобальную область видимости для доступа из app.js
window.loadPlayers = function() {
  console.log("Функция loadPlayers устарела, используйте loadAllPlayers");

  // Вызываем loadAllPlayers вместо загрузки из коллекции players
  if (typeof window.loadAllPlayers === 'function') {
    return window.loadAllPlayers()
      .then(players => {
        // Сохраняем игроков в localStorage для совместимости с текущим кодом
        localStorage.setItem("badmintonPlayers", JSON.stringify(players));

        // Обновляем UI
        if (typeof renderPlayers === "function") {
          renderPlayers();
        }

        return players;
      });
  } else {
    console.error("Функция loadAllPlayers не найдена");
    return Promise.resolve([]);
  }
}

// Функция для загрузки игроков из коллекции allPlayers
window.loadAllPlayers = function() {
  console.log("Вызвана функция loadAllPlayers");

  // Проверяем, авторизован ли пользователь
  if (!auth.currentUser) {
    console.error("Ошибка: пользователь не авторизован в loadAllPlayers");
    return Promise.reject(new Error("Пользователь не авторизован"));
  }

  console.log("Пользователь авторизован:", auth.currentUser.email);
  console.log("Загружаем игроков из коллекции allPlayers");

  return db.collection("allPlayers")
    .get()
    .then((querySnapshot) => {
      console.log("Получен ответ от Firestore, документов:", querySnapshot.size);

      const players = [];
      querySnapshot.forEach((doc) => {
        console.log("Документ:", doc.id, doc.data());
        players.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log("Загружено игроков:", players.length);
      console.log("Список игроков:", players);
      return players;
    })
    .catch((error) => {
      console.error("Ошибка загрузки игроков из allPlayers:", error);
      return [];
    });
}

// Функция для добавления игрока в коллекцию allPlayers
window.addPlayerToAllPlayers = function(player) {
  console.log("Вызвана функция addPlayerToAllPlayers с данными:", player);

  // Проверяем, авторизован ли пользователь
  if (!auth.currentUser) {
    console.error("Ошибка: пользователь не авторизован в addPlayerToAllPlayers");
    return Promise.reject(new Error("Пользователь не авторизован"));
  }

  console.log("Пользователь авторизован:", auth.currentUser.email);

  // Проверяем структуру объекта player
  if (!player.firstName || !player.lastName || player.rating === undefined) {
    console.error("Ошибка: неверная структура объекта игрока", player);
    return Promise.reject(new Error("Неверная структура объекта игрока"));
  }

  console.log("Структура объекта игрока корректна");
  console.log("Добавляем игрока в коллекцию allPlayers");

  // Добавляем нового игрока в коллекцию allPlayers
  return db.collection("allPlayers").add(player)
    .then((docRef) => {
      console.log("Игрок успешно добавлен в allPlayers с ID:", docRef.id);
      return docRef.id;
    })
    .catch(error => {
      console.error("Ошибка при добавлении игрока в allPlayers:", error);
      throw error;
    });
}

// Функция для сохранения тренировки
// Экспортируем в глобальную область видимости для доступа из app.js
window.saveTraining = function(training) {
  const user = auth.currentUser;
  if (!user) return Promise.reject(new Error("Пользователь не авторизован"));

  // Добавляем userId к тренировке
  training.userId = user.uid;

  // Если у тренировки есть id, обновляем существующую
  if (training.id) {
    const trainingId = training.id;
    // Удаляем id из объекта, так как он хранится как ключ документа
    delete training.id;

    return db.collection("trainings").doc(trainingId).update(training)
      .then(() => {
        console.log("Тренировка обновлена");
        // Перезагружаем тренировки
        loadUserTrainings();
        return trainingId;
      });
  } else {
    // Иначе создаем новую
    return db.collection("trainings").add(training)
      .then((docRef) => {
        console.log("Тренировка добавлена с ID:", docRef.id);
        // Перезагружаем тренировки
        loadUserTrainings();
        return docRef.id;
      });
  }
}

// Функция для удаления тренировки
// Экспортируем в глобальную область видимости для доступа из app.js
window.deleteTrainingFromFirebase = function(trainingId) {
  const user = auth.currentUser;
  if (!user) return Promise.reject(new Error("Пользователь не авторизован"));

  return db.collection("trainings").doc(trainingId).delete()
    .then(() => {
      console.log("Тренировка удалена из Firebase");
      // Перезагружаем тренировки
      loadUserTrainings();
    });
}

// Функция для сохранения игрока
// Экспортируем в глобальную область видимости для доступа из app.js
window.savePlayer = function(player) {
  console.log("Сохранение игрока:", player);
  console.log("Текущий пользователь:", auth.currentUser);
  console.log("Доступ к Firestore:", !!db);

  // Проверяем, авторизован ли пользователь
  if (!auth.currentUser) {
    console.error("Ошибка: пользователь не авторизован");
    return Promise.reject(new Error("Пользователь не авторизован"));
  }

  // Если у игрока есть id, обновляем существующего
  if (player.id) {
    const playerId = player.id;
    // Удаляем id из объекта, так как он хранится как ключ документа
    delete player.id;

    console.log("Обновляем игрока с ID:", playerId, player);

    return db.collection("allPlayers").doc(playerId).update(player)
      .then(() => {
        console.log("Игрок успешно обновлен");
        // Перезагружаем игроков
        window.loadAllPlayers()
          .then(players => {
            localStorage.setItem("badmintonPlayers", JSON.stringify(players));
            if (typeof renderPlayers === "function") {
              renderPlayers();
            }
          });
        return playerId;
      })
      .catch(error => {
        console.error("Ошибка при обновлении игрока:", error);
        throw error;
      });
  } else {
    // Иначе создаем нового
    console.log("Создаем нового игрока:", player);

    // Проверяем структуру объекта player
    if (!player.firstName || !player.lastName || player.rating === undefined) {
      console.error("Ошибка: неверная структура объекта игрока", player);
      return Promise.reject(new Error("Неверная структура объекта игрока"));
    }

    // Добавляем нового игрока в коллекцию allPlayers
    return db.collection("allPlayers").add(player)
      .then((docRef) => {
        console.log("Игрок успешно добавлен с ID:", docRef.id);
        // Перезагружаем игроков
        window.loadAllPlayers()
          .then(players => {
            localStorage.setItem("badmintonPlayers", JSON.stringify(players));
            if (typeof renderPlayers === "function") {
              renderPlayers();
            }
          });
        return docRef.id;
      })
      .catch(error => {
        console.error("Ошибка при добавлении игрока:", error);
        throw error;
      });
  }
}

// Функция для удаления игрока из коллекции allPlayers
// Экспортируем в глобальную область видимости для доступа из app.js
window.deletePlayerFromAllPlayers = function(playerId) {
  console.log("Удаление игрока из allPlayers с ID:", playerId);

  // Проверяем, авторизован ли пользователь
  if (!auth.currentUser) {
    console.error("Ошибка: пользователь не авторизован");
    return Promise.reject(new Error("Пользователь не авторизован"));
  }

  console.log("Пользователь авторизован:", auth.currentUser.email);
  console.log("Удаляем игрока с ID:", playerId);

  // Сначала проверим, существует ли документ с таким ID
  return db.collection("allPlayers").doc(playerId).get()
    .then(doc => {
      if (!doc.exists) {
        console.error("Ошибка: документ с ID", playerId, "не найден в коллекции allPlayers");
        throw new Error("Документ с указанным ID не найден");
      }

      console.log("Документ найден:", doc.data());
      console.log("Удаляем документ с ID:", playerId);

      // Удаляем документ
      return db.collection("allPlayers").doc(playerId).delete();
    })
    .then(() => {
      console.log("Игрок успешно удален из коллекции allPlayers");

      // Загружаем обновленный список игроков
      return window.loadAllPlayers()
        .then(allPlayers => {
          console.log("Загружен обновленный список игроков после удаления:", allPlayers.length);

          // Обновляем UI через глобальную функцию
          if (typeof window.updatePlayersInMemory === 'function') {
            console.log("Обновляем список игроков в памяти через updatePlayersInMemory");
            window.updatePlayersInMemory(allPlayers);
          } else if (typeof renderPlayers === 'function') {
            // Для совместимости со старым кодом
            console.log("Обновляем список игроков в памяти через renderPlayers");
            window.players = allPlayers;
            renderPlayers();
          }

          return true;
        });
    })
    .catch(error => {
      console.error("Ошибка при удалении игрока из allPlayers:", error);
      throw error;
    });
}

// Функция для отображения экрана входа
function showLoginScreen() {
  const loginScreen = document.getElementById("login-screen");
  const appContent = document.getElementById("app-content");
  
  if (loginScreen) loginScreen.style.display = "flex";
  if (appContent) appContent.style.display = "none";
}

// Функция для скрытия экрана входа
function hideLoginScreen() {
  const loginScreen = document.getElementById("login-screen");
  const appContent = document.getElementById("app-content");
  
  if (loginScreen) loginScreen.style.display = "none";
  if (appContent) appContent.style.display = "block";
}

// Функция для очистки данных пользователя
function clearUserData() {
  localStorage.removeItem("badmintonTrainings");
  // Не очищаем игроков, так как они общие
}