const gameStatusEl = document.getElementById("gameStatus");
const simTimeEl = document.getElementById("simTime");
const queueCountEl = document.getElementById("queueCount");
const maxQueueEl = document.getElementById("maxQueue");
const mistakesEl = document.getElementById("mistakes");
const scoreEl = document.getElementById("score");
const decisionTimerEl = document.getElementById("decisionTimer");
const serviceTimerEl = document.getElementById("serviceTimer");
const clientPanelEl = document.getElementById("clientPanel");
const logListEl = document.getElementById("logList");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const actionButtons = document.querySelectorAll(".action-btn");

const operations = {
  withdraw: "Снятие",
  deposit: "Пополнение",
  loan: "Кредит",
  savings: "Вклад",
  fx: "Обмен",
  balance: "Баланс"
};

const names = ["Иван", "Анна", "Сергей", "Мария", "Олег", "Елена"];

let gameRunning = false;
let simTime = 0;
let timerId = null;
let currentClient = null;
let score = 0;
let mistakes = 0;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOperation() {
  const keys = Object.keys(operations);
  return randomItem(keys);
}

function createClient() {
  const op = randomOperation();
  const amount = Math.floor(Math.random() * 9000) + 1000;

  return {
    name: randomItem(names),
    operation: op,
    amount: amount,
    status: "Обычный"
  };
}

function getRequestText(client) {
  switch (client.operation) {
    case "withdraw":
      return `Хочет снять ${client.amount} ₽`;
    case "deposit":
      return `Хочет пополнить счёт на ${client.amount} ₽`;
    case "loan":
      return `Хочет оформить кредит на ${client.amount} ₽`;
    case "savings":
      return `Хочет открыть вклад на ${client.amount} ₽`;
    case "fx":
      return `Хочет обменять ${client.amount} USD`;
    case "balance":
      return "Хочет проверить баланс";
    default:
      return "Неизвестный запрос";
  }
}

function renderClient() {
  if (!currentClient) {
    clientPanelEl.className = "client-panel empty";
    clientPanelEl.innerHTML = `
      <div class="empty-title">Нет клиента у окна</div>
      <div class="empty-text">Нажмите «Старт», чтобы начать симуляцию.</div>
    `;
    decisionTimerEl.textContent = "—";
    serviceTimerEl.textContent = "—";
    return;
  }

  clientPanelEl.className = "client-panel";
  clientPanelEl.innerHTML = `
    <div class="client-title">${currentClient.name}</div>
    <div class="client-request">${getRequestText(currentClient)}</div>

    <div class="client-data">
      <div class="data-box">
        <span>Статус</span>
        <strong>${currentClient.status}</strong>
      </div>

      <div class="data-box">
        <span>Операция</span>
        <strong>${operations[currentClient.operation]}</strong>
      </div>

      <div class="data-box">
        <span>Сумма</span>
        <strong>${currentClient.amount} ₽</strong>
      </div>

      <div class="data-box">
        <span>Комментарий</span>
        <strong>Ожидает обслуживание</strong>
      </div>
    </div>
  `;

  decisionTimerEl.textContent = "∞";
  serviceTimerEl.textContent = "∞";
}

function addLog(text, type = "") {
  const item = document.createElement("div");
  item.className = `log-item ${type}`.trim();
  item.textContent = `[${simTime}s] ${text}`;
  logListEl.prepend(item);
}

function updateStats() {
  gameStatusEl.textContent = gameRunning ? "Работа" : "Пауза";
  simTimeEl.textContent = simTime;
  queueCountEl.textContent = currentClient ? 1 : 0;
  maxQueueEl.textContent = currentClient ? 1 : 0;
  mistakesEl.textContent = mistakes;
  scoreEl.textContent = score;
}

function spawnClient() {
  currentClient = createClient();
  addLog(`Новый клиент: ${currentClient.name}`, "warn");
  renderClient();
  updateStats();
}

function tick() {
  if (!gameRunning) return;
  simTime++;
  updateStats();

  if (!currentClient) {
    spawnClient();
  }
}

function startGame() {
  if (gameRunning) return;
  gameRunning = true;

  if (!timerId) {
    timerId = setInterval(tick, 1000);
  }

  if (!currentClient) {
    spawnClient();
  }

  addLog("Игра запущена", "success");
  updateStats();
}

function pauseGame() {
  gameRunning = false;
  addLog("Игра поставлена на паузу", "warn");
  updateStats();
}

function resetGame() {
  gameRunning = false;
  simTime = 0;
  currentClient = null;
  score = 0;
  mistakes = 0;
  logListEl.innerHTML = "";
  renderClient();
  updateStats();
  addLog("Игра сброшена", "warn");
}

function handleAction(op) {
  if (!gameRunning || !currentClient) return;

  if (op === currentClient.operation) {
    score += 10;
    addLog(`Клиент ${currentClient.name} обслужен правильно`, "success");
  } else {
    mistakes++;
    addLog(`Ошибка при обслуживании клиента ${currentClient.name}`, "error");
  }

  currentClient = null;
  renderClient();
  updateStats();
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetGame);

actionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    handleAction(btn.dataset.op);
  });
});

renderClient();
updateStats();