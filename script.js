
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const box = 20;
const canvasSize = 400;
const rows = canvasSize / box;

// === Завантаження зображень ===
const foodImg = new Image();
foodImg.src = 'img/food.png';

const headImg = new Image();
headImg.src = 'img/head.png';

const bodyVertical = new Image();
bodyVertical.src = 'img/bodyVertical.png';
const bodyVerticalL = new Image();
bodyVerticalL.src = 'img/bodyVerticalL.png';

const bodyHorizontalA = new Image();
bodyHorizontalA.src = 'img/bodyHorizontalA.png';

const bodyHorizontalB = new Image();
bodyHorizontalB.src = 'img/bodyHorizontalB.png';

const connectorL = new Image();
connectorL.src = 'img/connectorL.png';

const connectorR = new Image();
connectorR.src = 'img/connectorR.png';

const tailImg = new Image();
tailImg.src = 'img/tail.png';

const scoreIcon = new Image();
scoreIcon.src = 'img/score.png';

const heartImg = new Image();
heartImg.src = 'img/heart.png';

const heartBrokenImg = new Image();
heartBrokenImg.src = 'img/heartBroken.png';

const poisonImg = new Image();
poisonImg.src = 'img/poison.png';

const grapeImg = new Image();
grapeImg.src = 'img/grape.png';

// === Звуки ===
const eatSound = new Audio('sounds/eat.mp3');
const poisonSound = new Audio('sounds/poison.mp3');
const grapeSound = new Audio('sounds/grape.mp3');
const seedHitSound = new Audio('sounds/seed-hit.mp3');
const gameOverSound = new Audio('sounds/game-over.mp3');
const collisionSound = new Audio('sounds/collision.mp3');

// === Глобальні змінні ===
let snake, direction, food, game;
let gameOver = false;
let lives = 3;
const maxLives = 3;
let score = 0;
let horizontalFrameToggle = false; // перемикач для чергування картинки тіла (горизонтально)
let verticalFrameToggle = false; // перемикач для вертикальної анімації
let poison = null;
let poisonTimer = null;
let poisonCooldown = false;

let grape = null;
let grapeTimer = null;
let grapeReady = true; // чи дозволено створювати новий виноград
let grapeCount = 0; // кількість доступних "плювків"
let seeds = []; // активні кісточки

//Розблокування звууків
let audioUnlocked = false;

// === Функція для безпечного відтворення звуків ===
function playSound(sound) {
	if (!audioUnlocked) return; // ще не можна відтворювати
	sound.currentTime = 0;       // обнуляємо час, щоб звук завжди відтворювався з початку
	sound.play().catch(e => console.log('Sound play failed', e));
}


document.addEventListener('click', () => {
	if (!audioUnlocked) {
		poisonSound.play().then(() => {
			poisonSound.pause();
			poisonSound.currentTime = 0;
			audioUnlocked = true; // тепер можна відтворювати звук без помилок
		}).catch(e => console.log('Audio unlock failed', e));
	}
}, { once: true });


document.addEventListener('keydown', setDirection);

function setDirection(e) {
	if (e.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
	else if (e.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
	else if (e.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
	else if (e.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
}

document.addEventListener('keydown', (e) => {
	setDirection(e);
	if (e.code === 'Space') shootSeed();
});

function shootSeed() {
	if (grapeCount <= 0) return;

	const head = snake[0];
	let dx = 0, dy = 0;

	if (direction === 'UP') dy = -box;
	else if (direction === 'DOWN') dy = box;
	else if (direction === 'LEFT') dx = -box;
	else if (direction === 'RIGHT') dx = box;

	const seed = {
		x: head.x + dx,
		y: head.y + dy,
		dx,
		dy,
		steps: 3
	};

	seeds.push(seed);
	grapeCount--;
}

function spawnFood() {
	return {
		x: Math.floor(Math.random() * rows) * box,
		y: Math.floor(Math.random() * rows) * box,
	};
}

function spawnPoison() {
	if (poisonCooldown) return; // блокуємо появу
	poison = {
		x: Math.floor(Math.random() * rows) * box,
		y: Math.floor(Math.random() * rows) * box
	};

	// Видаляємо мухомор через 10 секунд, якщо його не з’їли
	clearTimeout(poisonTimer);
	poisonTimer = setTimeout(() => {
		poison = null;
		startPoisonCooldown(); // ⬅️ запускаємо кулдаун після зникнення
	}, 10000);
}
function startPoisonCooldown() {
	poisonCooldown = true;
	setTimeout(() => {
		poisonCooldown = false;
	}, 15000); // 15 секунд кулдауну після зникнення
}

function spawnGrape() {
	if (!grapeReady || score >= 30) return;

	grape = spawnFood(); // та сама логіка, що для їжі
	grapeReady = false;

	// Виноград зникне через 5 секунд, якщо не з’їли
	clearTimeout(grapeTimer);
	grapeTimer = setTimeout(() => {
		grape = null;
	}, 5000);
}

function startGame() {
	snake = [{ x: 9 * box, y: 9 * box }];
	direction = 'RIGHT';
	food = spawnFood();
	gameOver = false; // Скидаємо стан поразки
	poison = null; // Скидаю отруту
	clearTimeout(poisonTimer);
	clearInterval(game);
	game = setInterval(draw, 120);
}
//Функція перезапуску гри при втраті життів
function resetFullGame() {
	lives = 3;
	score = 0;
	startGame();
}
function drawGameOverScreen() {
	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
	ctx.fillRect(0, canvasSize / 2 - 50, canvasSize, 100);

	ctx.fillStyle = '#FFD700';
	ctx.font = '48px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('Рахунок: ' + score, canvasSize / 2, canvasSize / 2);
}
function drawHearts() {
	for (let i = 0; i < maxLives; i++) {
		const img = i < lives ? heartImg : heartBrokenImg;
		ctx.drawImage(img, canvasSize - (i + 1) * (box + 5), 5, box, box);
	}
}

function draw() {
	ctx.clearRect(0, 0, canvasSize, canvasSize);

	// === Малювання змійки ===
	for (let i = 0; i < snake.length; i++) {
		let part = snake[i];

		if (i === 0) {
			// Голова зі збереженням обертання
			ctx.save();
			ctx.translate(part.x + box / 2, part.y + box / 2);

			if (direction === 'UP') ctx.rotate(Math.PI);
			else if (direction === 'LEFT') ctx.rotate(Math.PI / 2);
			else if (direction === 'RIGHT') ctx.rotate(-Math.PI / 2);
			// Вниз — без обертання

			ctx.drawImage(headImg, -box / 2, -box / 2, box, box);
			ctx.restore();
		} else if (i === snake.length - 1) {

			const tail = snake[i];
			const beforeTail = snake[i - 1];

			// Визначаємо напрям хвоста
			let angle = 0;

			if (beforeTail.x < tail.x) angle = Math.PI / 2;        // хвіст дивиться ліворуч
			else if (beforeTail.x > tail.x) angle = -Math.PI / 2;  // хвіст дивиться праворуч
			else if (beforeTail.y < tail.y) angle = Math.PI;       // хвіст дивиться вгору
			else if (beforeTail.y > tail.y) angle = 0;             // хвіст дивиться вниз

			// Малюємо з обертанням
			ctx.save();
			ctx.translate(tail.x + box / 2, tail.y + box / 2);
			ctx.rotate(angle);
			ctx.drawImage(tailImg, -box / 2, -box / 2, box, box);
			ctx.restore(); // хвіст
		} else {

			const prev = snake[i - 1];
			const next = snake[i + 1];

			if (prev && next) {
				let isVertical = (prev.x === part.x && next.x === part.x);
				let isHorizontal = (prev.y === part.y && next.y === part.y);

				// if (isVertical) {
				// 	// Чергуємо картинки
				// 	const img = verticalFrameToggle ? bodyVertical : bodyVerticalL;
				// 	ctx.drawImage(img, part.x, part.y, box, box);
				// } else if (isHorizontal) {
				// 	// Чергуємо картинки
				// 	const img = horizontalFrameToggle ? bodyHorizontalA : bodyHorizontalB;
				// 	ctx.drawImage(img, part.x, part.y, box, box);
				// } else {
				// 	// якщо це кут — використовуємо вертикальне як запасне
				// 	ctx.drawImage(bodyVertical, part.x, part.y, box, box);
				// }
				// Перевірка на поворот
				let isTurn = (
					(prev.x !== part.x && next.y !== part.y) ||
					(prev.y !== part.y && next.x !== part.x)
				);

				if (isTurn) {
					ctx.save();
					ctx.translate(part.x + box / 2, part.y + box / 2);

					// Визначення напряму повороту й обертання
					if ((prev.x < part.x && next.y < part.y) || (next.x < part.x && prev.y < part.y)) {
						ctx.rotate(Math.PI); // поворот ліво-вгору
						ctx.drawImage(connectorL, -box / 2, -box / 2, box, box);
					} else if ((prev.x > part.x && next.y < part.y) || (next.x > part.x && prev.y < part.y)) {
						ctx.rotate(Math.PI / 2); // право-вгору
						ctx.drawImage(connectorR, -box / 2, -box / 2, box, box);
					} else if ((prev.x > part.x && next.y > part.y) || (next.x > part.x && prev.y > part.y)) {
						ctx.rotate(0); // право-вниз
						ctx.drawImage(connectorL, -box / 2, -box / 2, box, box);
					} else if ((prev.x < part.x && next.y > part.y) || (next.x < part.x && prev.y > part.y)) {
						ctx.rotate(-Math.PI / 2); // ліво-вниз
						ctx.drawImage(connectorR, -box / 2, -box / 2, box, box);
					}
					ctx.restore();
				} else {
					// Стара логіка — тіло
					if (isVertical) {
						// const img = verticalFrameToggle ? bodyVertical : bodyVerticalL;
						const img = Math.floor(i / 2) % 2 === 0 ? bodyVertical : bodyVerticalL;
						ctx.drawImage(img, part.x, part.y, box, box);
					} else if (isHorizontal) {
						// const img = horizontalFrameToggle ? bodyHorizontalA : bodyHorizontalB;
						const img = Math.floor(i / 2) % 2 === 0 ? bodyHorizontalA : bodyHorizontalB;
						ctx.drawImage(img, part.x, part.y, box, box);
					} else {
						ctx.drawImage(bodyVertical, part.x, part.y, box, box);
					}
				}
			}
			// else {
			// 	// якщо prev або next немає — просто малюємо вертикальне
			// 	ctx.drawImage(bodyVertical, part.x, part.y, box, box);
			// } // тіло
		}
	}
	// перемикаю стан
	horizontalFrameToggle = !horizontalFrameToggle;
	verticalFrameToggle = !verticalFrameToggle;

	// === Малюємо їжу ===
	ctx.drawImage(foodImg, food.x, food.y, box, box);

	// === Отруйна їжа: мухомор ===

	// Якщо змійка досягла довжини 7 і отрути ще нема — створити
	if (snake.length >= 7 && !poison) {
		spawnPoison();
	}

	// Якщо отрута є — малюємо
	if (poison) {
		ctx.drawImage(poisonImg, poison.x, poison.y, box, box);
	}

	// === Виноград ===
	if (score >= 20 && !grape && grapeReady) {
		spawnGrape();
	}

	if (grape) {
		ctx.drawImage(grapeImg, grape.x, grape.y, box, box);
	}



	// Малювання сердець (життів)

	drawHearts();
	// === Рух змійки ===
	let head = { ...snake[0] };
	if (direction === 'UP') head.y -= box;
	else if (direction === 'DOWN') head.y += box;
	else if (direction === 'LEFT') head.x -= box;
	else if (direction === 'RIGHT') head.x += box;

	// === Перевірка на програш ===
	if (
		head.x < 0 || head.x >= canvasSize ||
		head.y < 0 || head.y >= canvasSize ||
		snake.some((segment) => segment.x === head.x && segment.y === head.y)
	) {
		//collisionSound.play(); Звук удару в стіну
		playSound(collisionSound);
		lives--;

		if (lives > 0) {
			// Продовжуємо гру: зменшуємо життя і перезапускаємо зі збереженням рахунку
			clearInterval(game);
			setTimeout(() => {
				startGame();
			}, 500); // Невелика пауза перед рестартом
		} else {
			// Коли життя закінчились — повна поразка
			clearInterval(game);
			gameOver = true;
			//gameOverSound.play(); Звук програшу
			playSound(gameOverSound);
			// ОНОВЛЕННЯ! Намалювати розбиті серця перед екраном поразки
			drawHearts();
			drawGameOverScreen();
			setTimeout(() => {
				document.getElementById('final-score').textContent = score;
				document.getElementById('game-over-modal').style.display = 'block';
			}, 2000);
		}
		return;
	}

	// === Кісточки (плювки) ===
	for (let i = seeds.length - 1; i >= 0; i--) {
		const seed = seeds[i];
		seed.x += seed.dx;
		seed.y += seed.dy;
		seed.steps--;

		// Малюємо як маленьке коло (можеш замінити на зображення, якщо буде)
		ctx.fillStyle = 'lime';
		ctx.beginPath();
		ctx.arc(seed.x + box / 2, seed.y + box / 2, box / 4, 0, Math.PI * 2);
		ctx.fill();

		// Якщо кісточка влучає в яблуко (food)
		if (seed.x === food.x && seed.y === food.y) {
			food = spawnFood();  // знищуємо яблуко
			seeds.splice(i, 1);  // видаляємо кісточку
			seedHitSound.play(); // ← Звук влучання кісточкою в їжу
			continue;
		}

		// Якщо вийшла за межі або вичерпала кроки
		if (
			seed.x < 0 || seed.x >= canvasSize ||
			seed.y < 0 || seed.y >= canvasSize ||
			seed.steps <= 0
		) {
			seeds.splice(i, 1); // видалити кісточку
		}
	}

	snake.unshift(head);

	if (head.x === food.x && head.y === food.y) {
		score++;
		food = spawnFood();
		eatSound.play(); // ← Звук з'їдання яблука

		// Якщо дозволено появу винограду — спробуємо його створити
		if (!grape && score >= 20 && score < 30) {
			grapeReady = true; // дозволяємо створити виноград
		}
	} else if (poison && head.x === poison.x && head.y === poison.y) {
		poison = null;
		clearTimeout(poisonTimer);
		poisonSound.play(); // ← Звук з'їдання мухомора

		// Відрізаємо 5 сегментів, але залишаємо голову та мінімум ще 1 сегмент
		snake.splice(snake.length - 5, 5);
	} else if (grape && head.x === grape.x && head.y === grape.y) {
		grape = null;
		grapeCount++; // дає 1 "плювок"
		clearTimeout(grapeTimer); // скасовуємо таймер зникнення
		grapeSound.play(); // ← Звук з'їдання винограду
	} else {
		snake.pop();
	}
	// === Лічильник балів (зірка + цифра) ===
	const scoreX = 10;           // X-позиція зірки
	const scoreY = 10;           // Y-позиція зірки
	const iconSize = 15;         // Розмір іконки

	// Малюємо піктограму зірки
	ctx.drawImage(scoreIcon, scoreX, scoreY, iconSize, iconSize);

	// Текст рахунку
	ctx.fillStyle = "#315114";   // Золотий колір (або будь-який)
	ctx.font = "16px Arial";
	ctx.textBaseline = "middle";
	ctx.fillText(score, scoreX + iconSize + 8, scoreY + iconSize / 1.5);

}

// === Запуск гри після завантаження зображень ===
let imagesLoaded = 0;
const totalImages = 14;

function imageReady() {
	imagesLoaded++;
	if (imagesLoaded === totalImages) {
		startGame();
	}
}

headImg.onload = imageReady;
bodyVertical.onload = imageReady;
bodyVerticalL.onload = imageReady;
bodyHorizontalA.onload = imageReady;
bodyHorizontalB.onload = imageReady;
tailImg.onload = imageReady;
foodImg.onload = imageReady;
connectorL.onload = imageReady;
connectorR.onload = imageReady;
scoreIcon.onload = imageReady;
heartImg.onload = imageReady;
heartBrokenImg.onload = imageReady;
poisonImg.onload = imageReady;
grapeImg.onload = imageReady;

// document.addEventListener('DOMContentLoaded', () => {
// 	const restartBtn = document.getElementById('restart-btn');
// 	if (restartBtn) {
// 		restartBtn.addEventListener('click', () => {
// 			document.getElementById('game-over-modal').style.display = 'none';
// 			resetFullGame();
// 		});
// 	}
// 	// const exitBtn = document.getElementById('exit-btn');
// 	// if (exitBtn) {
// 	// 	exitBtn.addEventListener('click', () => {
// 	// 		// Можеш замінити на перехід в меню або іншу дію
// 	// 		window.location.reload(); // Перезапускає сторінку
// 	// 	});
// 	// }
// 	// Обробник кнопки "Вийти"
// 	const exitBtn = document.getElementById('exit-btn');
// 	if (exitBtn) {
// 		exitBtn.addEventListener('click', () => {
// 			// Зупинити гру
// 			clearInterval(game);
// 			gameOver = true;

// 			// Приховати модальне вікно
// 			document.getElementById('game-over-modal').style.display = 'none';

// 			// Очистити canvas
// 			ctx.clearRect(0, 0, canvas.width, canvas.height);

// 			// Показати текст "Дякуємо за гру!"
// 			ctx.fillStyle = 'green';
// 			ctx.font = '54px Arial';
// 			ctx.textAlign = 'center';
// 			ctx.textBaseline = 'middle';
// 			ctx.fillText('Дякуємо за гру!', canvas.width / 2, canvas.height / 2);
// 		});
// 	}
// });
document.addEventListener('DOMContentLoaded', () => {
	const restartBtn = document.getElementById('restart-btn');
	const exitBtn = document.getElementById('exit-btn');
	const buttons = [restartBtn, exitBtn];
	let selectedButtonIndex = 0;

	function updateButtonFocus(index) {
		buttons.forEach((btn, i) => {
			if (i === index) {
				btn.classList.add('focused');
				btn.focus();
			} else {
				btn.classList.remove('focused');
			}
		});
	}

	// Початковий фокус
	updateButtonFocus(selectedButtonIndex);

	if (restartBtn) {
		restartBtn.addEventListener('click', () => {
			document.getElementById('game-over-modal').style.display = 'none';
			resetFullGame();
		});

		// Додати фокус при наведенні миші
		restartBtn.addEventListener('mouseenter', () => {
			selectedButtonIndex = 0;
			updateButtonFocus(selectedButtonIndex);
		});
	}

	if (exitBtn) {
		exitBtn.addEventListener('click', () => {
			clearInterval(game);
			gameOver = true;
			gameOverSound.play(); // Звук закінчення гри
			document.getElementById('game-over-modal').style.display = 'none';
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = 'green';
			ctx.font = '54px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('Дякуємо за гру!', canvas.width / 2, canvas.height / 2);
		});

		exitBtn.addEventListener('mouseenter', () => {
			selectedButtonIndex = 1;
			updateButtonFocus(selectedButtonIndex);
		});
	}

	// Обробка клавіш
	document.addEventListener('keydown', (event) => {
		if (document.getElementById('game-over-modal').style.display !== 'none') {
			switch (event.key) {
				case 'ArrowLeft':
				case 'ArrowUp':
					selectedButtonIndex = (selectedButtonIndex - 1 + buttons.length) % buttons.length;
					updateButtonFocus(selectedButtonIndex);
					break;
				case 'ArrowRight':
				case 'ArrowDown':
					selectedButtonIndex = (selectedButtonIndex + 1) % buttons.length;
					updateButtonFocus(selectedButtonIndex);
					break;
				case 'Enter':
					buttons[selectedButtonIndex].click();
					break;
			}
		}
	});
});

