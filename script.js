var darkTheme = true;
var portalColors = true;

var gamePaused = false;
var menuOpen = false;
var howtoOpen = false;
var statsOpen = false;
var aboutOpen = false;

var gameOver = false;
var firstGame = true;

var expiredSession = false;
const allowExpiration = false; // Wordle doesn't have expiration, but I may want to implement this eventually, who knows

const firstgameMilli = new Date(2022, 8, 4, 0, 0, 0, 0).getTime();
const dayLength = 1000*60*60*24;
var gameNumber;

let gameTimerNext;
var playedGames = 0;
var winPercent = 0;
var currentStreak = 0;
var maxStreak = 0;
var guessDist1, guessDist2, guessDist3, guessDist4, guessDist5, guessDist6;
var gameTimer = 0;
var longTimerInfo = false;

let practiceMode = false;
var gameNumberOrPractice = "0";
let letters = ["QWERTYUIOP"," ASDFGHJKL ","*ZXCVBNM*"];

let wordOfTheDay;
let lastGame;
let tries = [];
let tiles = [];
let keys = [];
let currentTry = "";
let stats = [0,0,0,0,0,0,0]; // X, 1, 2, 3, 4, 5 and 6. This way, they even match the index!
const postGameMessages = [
	"", // X (no message, it'll be the word of the day) "How can you fail at this? It isn't even a test."
	"Congratulations!", // 1 "Congratulations. You are better than everyone."
	"Not bad!", // 2 "Not bad. I forgot how good you are at this."
	"Mildly impressive!", // 3 "That was genuinely mildly impressive."
	"Not completely bad!", // 4 "Very not completely bad."
	"Did well... enough.", // 5 "Did well... enough."
	"Phew!", // 6 "I was confident you could finish."
];

initializeGame();



function getGameNumber() {
	let curdate = new Date();
	curdate.setMilliseconds(0);
	curdate.setSeconds(0);
	curdate.setMinutes(0);
	curdate.setHours(0);

	let curdateMilli = curdate.getTime();
	let dif = curdateMilli - firstgameMilli;
	dif = dif / dayLength;
	if (dif <= 0) {
		dif = 0;
		// The first game will last ~48 hours
	}

	return dif+1;
}

function getAbsoluteDate(date) {
	date.setMilliseconds(0);
	date.setSeconds(0);
	date.setMinutes(0);
	date.setHours(0);
}

function addZeros(num, digits = 2) {
	let str = "";
	for (let i = 0; i < digits; i++) {
		str += "0";
	}
	str += num;
	return str.slice(-digits);
}

function gameTimerUpdate() {
	let gameTimerNow = new Date();
	let curdateMilli = gameTimerNow.getTime();
	
	let nextdateMilli = gameTimerNext.getTime();
	
	let totalSeconds = Math.floor((nextdateMilli - curdateMilli) / 1000);
	if (totalSeconds < 0) {
		totalSeconds = 0;
	}
	
	if (totalSeconds > 24*60*60) {
		longTimerInfo = true;
	} else {
		longTimerInfo = false;
	}
	
	let hours = Math.floor(totalSeconds / 60 / 60);
	totalSeconds -= hours*60*60;
	let minutes = Math.floor(totalSeconds / 60);
	totalSeconds -= minutes*60;
	
	let text = addZeros(hours) + ":" + addZeros(minutes) + ":" + addZeros(totalSeconds);
	
	gameTimer = text;
}

function checkExpiredSession() {
	if (allowExpiration) {
		
		if (expiredSession) {
			return true; // No need to double-check
		} else {
			let curGame = getGameNumber();
			if (curGame !== gameNumber) {
				expiredSession = true;
				document.getElementById("expired").show();
				return true;
			}
		}
		
	}
	return false;
}

function initializeGame() {
	loadData("gameNumber");
	if (gameNumber !== getGameNumber()) {
		// New game, clear data
		tries = [];
		currentTry = "";
		saveData("tries");
		saveData("currentTry");
		
		gameOver = false;
		saveData("gameOver");
	}
	gameNumber = getGameNumber();
	saveData("gameNumber");
	
	loadData("lastGame");
	if (lastGame === undefined) {
		lastGame = gameNumber;
	} else if (lastGame - gameNumber > 1) {
		currentStreak = 0;
		saveData("currentStreak");
	}
	
	let urlString = window.location.href;
	let urlParams = getURLParams(urlString);
	if (urlParams.practice && urlParams.practice === "true") {
		practiceMode = true;
		tries = [];
		currentTry = "";
		gameOver = false;
	}
	
	if (practiceMode) {
		wordOfTheDay = getWordOfTheDay();
		gameNumberOrPractice = "Practice";
	} else {
		wordOfTheDay = getWordOfTheDay(gameNumber);
		gameNumberOrPractice = "#" + gameNumber;
	}
	
	gameTimerNext = new Date();
	getAbsoluteDate(gameTimerNext);
	
	if (gameTimerNext.getTime() < firstgameMilli) {
		gameTimerNext.setTime(firstgameMilli);
		// The first game will last ~48 hours
	}
	
	gameTimerNext.setDate(gameTimerNext.getDate() + 1);
	
	updateMobileHeight();
}

function updateMobileHeight() {
	let root = document.querySelector(":root");
	
	root.style.setProperty("--Mobile-Page-Height", (window.innerHeight + "px"));
	
	setTimeout(function() {
		updateMobileHeight();
	}, 100);
}

function getURLParams(urlString) {
	let urlParamsString = urlString.match(/\?.+?$/);
	if (urlParamsString) {
		let urlParams = urlParamsString[0].slice(1).split("&");
		let retArray = {};
		for (let i = 0; i < urlParams.length; i++) {
			let pair = urlParams[i].split("=");
			retArray[ pair[0] ] = pair[1];
		}
		return retArray;
	}
	return {};
}

function checkFirstGame() {
	loadData("firstGame");
	if (firstGame === true) {
		firstGame = false;
		saveData("firstGame");
		showHowto();
	}
}

document.addEventListener("keydown", keyboardInput);

function keyboardInput(event) {
	if (gamePaused) return;
	let key = event.key;
	
	if (key.match(/^[a-z]$/i) || key === "Enter" || key === "Backspace") {
		writeToTry(key.toUpperCase());
	}
}

function getRow(row = tries.length) {
	return tiles[row][0].parentElement;
}

function getTile(row = tries.length, column = currentTry.length - 1) {
	return tiles[row][column]
}

function getKey(letter) {
	return keys.find((key) => {
		if (key.letter === letter) {
			return key;
		}
	});
	
}

function writeToTry(letter, cookieMode = false) {
	// First, make sure we aren't playing an outdated game
	if ( checkExpiredSession() || gameOver ) {
		return;
	}
	
	
	if (letter === "ENTER") {
		processWord(cookieMode);
	} else if (letter === "BACKSPACE") {
		if (currentTry.length > 0) {
			let tile = getTile();
			currentTry = currentTry.slice(0, -1);
			
			clearTile(tile);
			if (!cookieMode && !practiceMode) saveData("currentTry");
		}
		
		if (currentTry.length < 4 || wordList.includes(currentTry)) {
			getRow().classList.remove("failed");
		} else {
			getRow().classList.add("failed");
		}
	} else if (currentTry.length < 10) {
		currentTry += letter;
		
		let tile = getTile();
		
		tile.appendChild(document.createTextNode(letter));
		tile.classList.add("black-filling");
		tile.classList.remove("empty");
		if (!cookieMode && !practiceMode) saveData("currentTry");
		
		if (currentTry.length >= 4) {
			if (wordList.includes(currentTry)) {
				getRow().classList.remove("failed");
			} else {
				getRow().classList.add("failed");
			}
		}
	}
}

function processWord(cookieMode = false) {
	if (currentTry.length < 4) {
		notify("Word is too small!");
	} else {
		if (wordList.includes(currentTry)) {
			getRow().classList.remove("failed");
			
			let wordOfTheDayMod = wordOfTheDay;
			
			for (let pass = 0; pass <= 1; pass++) {
				for (let i = 0; i < currentTry.length; i++) {
					let letter = currentTry.charAt(i);
					
					let tile = getTile(tries.length, i);
					let key = getKey(letter);
					if (pass === 0 && wordOfTheDay.charAt(i) === letter) {
						tile.classList.remove("black-filling");
						tile.classList.add("green");
						tile.result = "green";
						wordOfTheDayMod = wordOfTheDayMod.slice(0, i) + "_" + wordOfTheDayMod.slice(i+1);
						
						if (!key.classList.contains("green")) {
							key.classList.add("green");
							key.classList.remove("yellow");
							key.classList.remove("black");
						}
					} else if (pass === 1) {
						if (wordOfTheDayMod.includes(letter)) {
							if (!tile.classList.contains("green")) {
								tile.classList.remove("black-filling");
								tile.classList.add("yellow");
								tile.result = "yellow";
								wordOfTheDayMod = wordOfTheDayMod.replace(letter, "_");
								
								if (!key.classList.contains("green")) {
									key.classList.add("yellow");
									key.classList.remove("black");
								}
							}
						} else {
							if (!tile.classList.contains("green")) {
								tile.classList.remove("black-filling");
								tile.classList.add("black");
								tile.result = "black";
							}
							if (!key.classList.contains("green")) {
								key.classList.add("black");
							}
						}
					}
				}
			}
			
			tries.push(currentTry);
			
			if (!cookieMode) {
				if (currentTry === wordOfTheDay || tries.length === 6) {
					postGameProcess();
				}
			}
			currentTry = "";
			if (!cookieMode && !practiceMode) saveData("tries");
			if (!cookieMode && !practiceMode) saveData("currentTry");
		} else {
			notify("Not in word list!");
		}
	}
}

function notify(message) {
	document.getElementById("notifications").showMessage(message);
}

function initializeThemes() {
	loadData("darkTheme");
	loadData("portalColors");
}

function initializeBoard() {
	let board = document.createElement("div");
	board.classList.add("board-inner");
	
	const rows = 6;
	const columns = 10;
	
	for (let row = 0; row < rows; row++) {
		let tilesRow = [];
		let rowDiv = document.createElement("div");
		rowDiv.classList.add("board-row");
		
		for (let column = 0; column < columns; column++) {
			let box = document.createElement("div");
			box.classList.add("board-box", "empty");
			if (column >= 4) {
				box.classList.add("extra")
			}
			let boxIdx = column + row*columns;
			box.idx = boxIdx;
			box.row = row;
			box.column = column;
			
			tilesRow.push(box);
			rowDiv.appendChild(box);
		}
		
		board.appendChild(rowDiv);
		
		tiles.push(tilesRow);
	}
	let boardMessageDiv = document.createElement("div");
	boardMessageDiv.classList.add("board-message");
	
	let boardMessageInnerDiv = document.createElement("div");
	let boardMessageInnerSpan = document.createElement("span");
	boardMessageInnerDiv.appendChild(boardMessageInnerSpan);
	boardMessageInnerDiv.classList.add("board-message-inner");
	boardMessageInnerDiv.setAttribute("id", "board-message-inner");
	boardMessageInnerDiv.setAttribute("visible", "false");
	
	boardMessageDiv.appendChild(boardMessageInnerDiv);
	board.appendChild(boardMessageDiv);
	document.getElementById("board").appendChild(board);
	
	initializeKeyboard();
	loadData();
	// toggleMenu(); // DEBUG
}

function showBoardMessage(message) {
	let element = document.getElementById("board-message-inner");
	element.setAttribute("visible", "true");
	let elementSpan = document.querySelector("#board-message-inner > span");
	elementSpan.innerHTML = message;
}

function hideBoardMessage() {
	let element = document.getElementById("board-message-inner");
	element.setAttribute("visible", "false");
}

function initializeKeyboard() {
	let keyboard = document.createElement("div");
	keyboard.classList.add("keyboard-inner");
	
	for (let row = 0; row < letters.length; row++){
		let rowDiv = document.createElement("div");
		rowDiv.classList.add("keyboard-row");
		
		for (let idx = 0; idx < letters[row].length; idx++) {
			let letter = letters[row].charAt(idx);
			
			let button;
			if (letter === " ") {
				button = document.createElement("div");
				button.style = "flex: 2";
			} else {
				button = document.createElement("button");
				button.setAttribute("type", "button");
				
				if (letter === "*") {
					if (idx === 0) {
						letter = "ENTER";
						button.onclick = function(){ writeToTry("ENTER"); };
					} else {
						letter = "";
						let backspaceButton = document.createElement("span");
						backspaceButton.classList.add("fa", "fa-fw", "fa-backspace");
						button.appendChild(backspaceButton);
						button.onclick = function(){ writeToTry("BACKSPACE"); };
					}
					button.classList.add("keyboard-button", "empty");
					button.style = "flex: 2";
				} else {
					button.classList.add("keyboard-button", "empty");
					button.onclick = function(){ writeToTry(letter); };
					button.letter = letter;
					keys.push(button);
				}
			}
			
			
			button.appendChild(document.createTextNode(letter));
			
			rowDiv.appendChild(button);
		}
		keyboard.appendChild(rowDiv);
	}
	
	document.getElementById("keyboard").appendChild(keyboard);
}

function getWordOfTheDay(seed) {
	// Practice mode
	if (seed === undefined) {
		let curDate = new Date();
		let func = mulberry32(curDate.getTime());
		let num = Math.floor(func() * wordList.length);
		
		return wordList[num];
	}
	
	// Prevents repeats on this cycle. That is, it won't repeat a word within the list's length.
	// When the game's number is greater than the list's length, a new seed is used and the process starts over.
	let wordsN = wordList.length;
	let seedMod = seed % wordsN;
	let seedMul = Math.floor(seed / wordsN);
	
	let func = mulberry32((seedMul + 20220626) * 17); // Just chose this date cuz it's roughly when I started working on Portle
	
	let wordListCopy = wordList.slice();
	let selectedWord;
	for (let i = 0; i <= seedMod; i++) {
		let num = Math.floor(func() * wordListCopy.length);
		selectedWord = wordListCopy[num];
		wordListCopy.splice(num, 1);
	}
	
	return selectedWord;
}

// Called when the game ends for the first time.
// That is, when the player hits enter on the last word.
// So it processes stuff like streaks and saves some data.
function postGameProcess() {
	let gameScore = postGameScore();
	
	postGameNotify(true); // true for "justWon"
	
	gameOver = true;
	
	let numberOfTries = tries.length;
	if (gameScore === 0) {
		numberOfTries = 0;
	} else {
		// Apply win animation to tiles
		setTimeout( function() {
			for (let i = 0; i < tries[tries.length-1].length; i++) {
				let tile = getTile(tries.length-1, i);
				tile.classList.add("victory");
			}
		}, (tries[tries.length-1].length * .25 + .25) * 1000);
	}
	
	if (practiceMode) {
		return;
	}
	
	saveData("gameOver");
	
	currentStreak++;
	if (gameScore === 0) {
		currentStreak = 0;
	}
	
	maxStreak = Math.max(currentStreak, maxStreak);
	
	saveData("currentStreak");
	saveData("maxStreak");
	
	lastGame = gameNumber;
	saveData("lastGame");
	
	stats[numberOfTries] = stats[numberOfTries] + 1;
	saveData("stats");
	
	currentTry = "";
	saveData("tries");
	saveData("currentTry");
}

// This, on the other hand, is called both when the player hits enter on the last word,
// AND also when they refresh the page after beating the daily game. So this is responsible
// for stuff like showing notifications and stats.
function postGameNotify(justWon = false) {
	// This is called only on the assumption that the game is over
	let gameScore = postGameScore();
	
	let notificationMessage;
	if (gameScore === 0) {
		notificationMessage = "The word was " + wordOfTheDay;
		showBoardMessage(notificationMessage);
	} else {
		notificationMessage = postGameMessages[gameScore];
		notify(notificationMessage)
	}
	
	if (practiceMode) {
		return;
	}
	
	let biggestWordLength = 0;
	if (justWon) {
		biggestWordLength = tries[tries.length-1].length;
	} else {
		for (let i = 0; i < tries.length; i++) {
			biggestWordLength = Math.max(tries[i].length, biggestWordLength);
		}
	}
	
	let statsDelay = .25 * biggestWordLength + .5; // Duration of turning animation
	if (justWon) {
		//Delay for victory animation
		statsDelay += .1 * biggestWordLength + .5;
	}
	setTimeout(function() {
		showStats();
	}, statsDelay * 1000);
}

function newGame() {
	if (menuOpen) {
		document.getElementById("menu").hide();
	}
	
	tries = [];
	currentTry = "";
	hideBoardMessage();
	gameOver = false;
	wordOfTheDay = getWordOfTheDay();
	
	for (let row = 0; row < 6; row++) {
		getRow(row).classList.remove("failed");
		for (let col = 0; col < 10; col++) {
			let tile = getTile(row, col);
			clearTile(tile);
		}
	}
	
	for (let idx = 0; idx < keys.length; idx++) {
		let key = keys[idx];
		key.classList.remove("black", "yellow", "green", "black-filling", "victory");
		key.classList.add("empty");
	}
}

function clearTile(tile) {
	if (tile.lastChild !== null) {
		tile.removeChild(tile.lastChild);
	}
	tile.classList.remove("black-filling", "green", "yellow", "black");
	tile.classList.add("empty");
}

function postGameScore() {
	let gameScore = 0;
	if (tries[tries.length-1] === wordOfTheDay) {
		gameScore = tries.length;
	}
	return gameScore;
}

function share() {
	let gameScore = postGameScore();
	let textToCopy = "";
	
	textToCopy += "Portle #" + gameNumber + " - ";
	if (gameScore === 0) {
		textToCopy += "X/6";
	} else {
		textToCopy += tries.length + "/6";
	}
	textToCopy += "\n";
	
	for (let i = 0; i < tries.length; i++) {
		textToCopy += "\n";
		
		if (i === tries.length-1 && gameScore > 0) {
			//Player won, so we don't give away the word length
			textToCopy += "✅";
		} else {
			let word = tries[i];
			for (let j = 0; j < word.length; j++) {
				let tile = getTile(i, j);
				if (tile.result === "black") {
					textToCopy += (darkTheme ? "⬛" : "⬜");
				} else if (tile.result === "yellow") {
					textToCopy += (portalColors ? "🟦" : "🟨");
				} else if (tile.result === "green") {
					textToCopy += (portalColors ? "🟧" : "🟩");
				}
			}
		}
	}
	
	if (gameScore === 0) {
		textToCopy += "\n";
		textToCopy += "❎";
	}
	
	navigator.clipboard.writeText(textToCopy);
	
	console.log(textToCopy);
	notify("📋 Copied results to clipboard!");
}

function mulberry32(a) {
	return function() {
		let t = a += 0x6D2B79F5;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	}
}

function parseBool(val) {
	return (val === "true");
}

function showMenu() {
	if (menuOpen) {
		// No need to show twice
		return;
	}
	document.getElementById("menu").show();
	gamePaused = true;
	menuOpen = true;
}

function showStats() {
	if (statsOpen) {
		// No need to show twice
		return;
	}

	guessDistMax = 0;
	playedGames = stats[0];
	for (let i = 1; i <= 6; i++) {
		window["guessDist" + i] = stats[i];
		guessDistMax = Math.max(guessDistMax, stats[i]);
		playedGames += stats[i];
	}

	if (playedGames > 0) {
		winPercent = (playedGames - stats[0]) / playedGames * 100;
	}
	
	document.getElementById("stats-played").update();
	document.getElementById("stats-wins").update();
	document.getElementById("stats-curstreak").update();
	document.getElementById("stats-maxstreak").update();
	
	for (let i = 1; i <= 6; i++) {
		document.getElementById("guess-dist-" + i).update();
		document.getElementById("guess-dist-" + i).classList.remove("highlight");
	}
	
	if (gameOver) {
		let gameScore = postGameScore();
		if (gameScore > 0) {
			document.getElementById("guess-dist-" + gameScore).classList.add("highlight");
		}
	}
	
	document.getElementById("game-timer").update();
	document.getElementById("share-container").update();
	document.getElementById("long-timer-button").update();
	
	gamePaused = true;
	statsOpen = true;
	document.getElementById("stats").show();
}

function showTimerInfo() {
	document.getElementById("timer-info").show();
}

function showPracticeInfo() {
	document.getElementById("practice-info").show();
}

function showHowto() {
	if (howtoOpen) {
		// No need to show twice
		return;
	}
	document.getElementById("howto").show();
	gamePaused = true;
	howtoOpen = true;
}

function showAbout() {
	if (aboutOpen) {
		document.getElementById("menu").hide();
	}
	document.getElementById("about").show();
	aboutAnimation();
	gamePaused = true;
	aboutOpen = true;
}

var aboutAnimTimeout, aboutAnimFinished;
function aboutAnimation() {
	if (aboutAnimFinished !== undefined) {
		return;
	}
	
	var aboutAnim = document.getElementById("about-anim");
	
	var aboutAnimClear = function(tile) {
		aboutAnim.children[tile].innerHTML = "";
		aboutAnim.children[tile].classList.remove("empty", "extra", "black", "yellow", "green");
		aboutAnim.children[tile].classList.add("empty");
		if (tile > 3) {
			aboutAnim.children[tile].classList.add("extra");
		}
	}
	var aboutAnimType = function(tile, letter) {
		aboutAnim.children[tile].innerHTML = letter;
		aboutAnim.children[tile].classList.remove("extra");
	}
	var aboutAnimColor = function(tile, color) {
		aboutAnim.children[tile].classList.remove("empty");
		aboutAnim.children[tile].classList.toggle(color);
	}
	
	for (let tile = 0; tile < 6; tile++) {
		aboutAnimClear(tile);
	}
	
	if (aboutAnimTimeout !== undefined) {
		for (let i = 0; i < aboutAnimTimeout.length; i++) {
			clearTimeout(aboutAnimTimeout[i]);
		}
	}
	
	aboutAnimTimeout = [
		setTimeout( () => {
			aboutAnimType(0, "W");
		}, 500+150*0 ),
		setTimeout( () => {
			aboutAnimType(1, "O");
		}, 500+150*1 ),
		setTimeout( () => {
			aboutAnimType(2, "R");
		}, 500+150*2 ),
		setTimeout( () => {
			aboutAnimType(3, "D");
		}, 500+150*3 ),
		setTimeout( () => {
			aboutAnimType(4, "L");
		}, 500+150*4 ),
		setTimeout( () => {
			aboutAnimType(5, "E");
		}, 500+150*5 ),
		setTimeout( () => {
			aboutAnimColor(0, "black");
			aboutAnimColor(1, "green");
			aboutAnimColor(2, "green");
			aboutAnimColor(3, "black");
			aboutAnimColor(4, "green");
			aboutAnimColor(5, "green");
		}, 1250 + 500 ),
		setTimeout( () => {
			aboutAnimClear(0);
			aboutAnimClear(1);
			aboutAnimClear(2);
			aboutAnimClear(3);
			aboutAnimClear(4);
			aboutAnimClear(5);
		}, 1750 + 6*.25*1000 + 1000 ),
		setTimeout( () => {
			aboutAnimType(0, "P");
		}, 4750+150*0 ),
		setTimeout( () => {
			aboutAnimType(1, "O");
		}, 4750+150*1 ),
		setTimeout( () => {
			aboutAnimType(2, "R");
		}, 4750+150*2 ),
		setTimeout( () => {
			aboutAnimType(3, "T");
		}, 4750+150*3 ),
		setTimeout( () => {
			aboutAnimType(4, "A");
		}, 4750+150*4 ),
		setTimeout( () => {
			aboutAnimType(5, "L");
		}, 4750+150*5 ),
		setTimeout( () => {
			aboutAnimColor(0, "green");
			aboutAnimColor(1, "green");
			aboutAnimColor(2, "green");
			aboutAnimColor(3, "green");
			aboutAnimColor(4, "black");
			aboutAnimColor(5, "yellow");
		}, 5650 + 500 ),
		setTimeout( () => {
			aboutAnimClear(0);
			aboutAnimClear(1);
			aboutAnimClear(2);
			aboutAnimClear(3);
			aboutAnimClear(4);
			aboutAnimClear(5);
		}, 6150 + 6*.25*1000 + 1000 ),
		setTimeout( () => {
			aboutAnimType(0, "P");
		}, 9150+150*0 ),
		setTimeout( () => {
			aboutAnimType(1, "O");
		}, 9150+150*1 ),
		setTimeout( () => {
			aboutAnimType(2, "R");
		}, 9150+150*2 ),
		setTimeout( () => {
			aboutAnimType(3, "T");
		}, 9150+150*3 ),
		setTimeout( () => {
			aboutAnimType(4, "L");
		}, 9150+150*4 ),
		setTimeout( () => {
			aboutAnimType(5, "E");
		}, 9150+150*5 ),
		setTimeout( () => {
			aboutAnimColor(0, "green");
			aboutAnimColor(1, "green");
			aboutAnimColor(2, "green");
			aboutAnimColor(3, "green");
			aboutAnimColor(4, "green");
			aboutAnimColor(5, "green");
		}, 10050 + 500 ),
		setTimeout( () => {
			aboutAnimColor(0, "victory");
			aboutAnimColor(1, "victory");
			aboutAnimColor(2, "victory");
			aboutAnimColor(3, "victory");
			aboutAnimColor(4, "victory");
			aboutAnimColor(5, "victory");
		}, 10550 + 6*.25*1000 + 250 ),
		setTimeout( () => {
			aboutAnimColor(0, "victory");
			aboutAnimColor(1, "victory");
			aboutAnimColor(2, "victory");
			aboutAnimColor(3, "victory");
			aboutAnimColor(4, "victory");
			aboutAnimColor(5, "victory");
			aboutAnimColor(0, "noanim");
			aboutAnimColor(1, "noanim");
			aboutAnimColor(2, "noanim");
			aboutAnimColor(3, "noanim");
			aboutAnimColor(4, "noanim");
			aboutAnimColor(5, "noanim");
			aboutAnimFinished = true;
		}, 12300 + .1*6*1000 + .4*1000 ),
	];
}

function unpauseGame() {
	if (!menuOpen && !howtoOpen && !statsOpen && !aboutOpen) {
		gamePaused = false;
	}
}

function toggleDarkTheme(cookieMode = false) {
	console.log("Dark theme: " + darkTheme);
	if (darkTheme) {
		document.getElementsByTagName("body")[0].classList.remove("lightTheme");
	} else {
		document.getElementsByTagName("body")[0].classList.add("lightTheme");
	}
	if (!cookieMode) {
		document.getElementsByTagName("body")[0].classList.add("lightThemeAnim");
		saveData("darkTheme");
	}
}

function togglePortalColors(cookieMode = false) {
	if (portalColors) {
		document.getElementsByTagName("body")[0].classList.remove("originalColors");
	} else {
		document.getElementsByTagName("body")[0].classList.add("originalColors");
	}
	if (!cookieMode) {
		document.getElementsByTagName("body")[0].classList.add("originalColorsAnim");
		saveData("portalColors");
	}
}

function loadData(tag) {
	function writeWord(word) {
		for (let i = 0; i < word.length; i++) {
			let letter = word.charAt(i);
			writeToTry(letter, true); // true for cookieMode
		}
	}
	
	if (tag === undefined || tag == "darkTheme") {
		let darkThemeData = getCookie("darkTheme");
		if (darkThemeData !== undefined && darkThemeData !== "") {
			darkTheme = parseBool(darkThemeData);
			toggleDarkTheme(true); // true for cookieMode
		}
	}
	
	if (tag === undefined || tag == "portalColors") {
		let portalColorsData = getCookie("portalColors");
		if (portalColorsData !== undefined && portalColorsData !== "") {
			portalColors = parseBool(portalColorsData);
			togglePortalColors(true); // true for cookieMode
		}
	}
	
	if (tag === undefined || tag == "gameNumber") {
		let gameNumberData = getCookie("gameNumber");
		if (gameNumberData !== undefined && gameNumberData !== "") {
			gameNumber = parseInt(gameNumberData);
		}
	}
	
	if (tag === undefined || tag == "lastGame") {
		let lastGameData = getCookie("lastGame");
		if (lastGameData !== undefined && lastGameData !== "") {
			lastGame = parseInt(lastGameData);
		}
	}
	
	if (tag === undefined || tag === "firstGame") {
		let firstGameData = getCookie("firstGame");
		if (firstGameData !== undefined && firstGameData !== "") {
			firstGame = parseBool(firstGameData);
		}
	}
	
	if (tag === undefined || tag == "currentStreak") {
		let currentStreakData = getCookie("currentStreak");
		if (currentStreakData !== undefined && currentStreakData !== "") {
			currentStreak = parseInt(currentStreakData);
		}
	}
	
	if (tag === undefined || tag == "maxStreak") {
		let maxStreakData = getCookie("maxStreak");
		if (maxStreakData !== undefined && maxStreakData !== "") {
			maxStreak = parseInt(maxStreakData);
		}
	}
	
	if (tag === undefined || tag === "stats") {
		let statsDataString = getCookie("stats");
		
		if (statsDataString.length > 0) {
			let statsDataArray = statsDataString.split(",");
			for (let idx = 0; idx < statsDataArray.length; idx++) {
				let statNumber = parseInt(statsDataArray[idx]);
				stats[idx] = statNumber;
			}
		}
	}
	
	if (tag === undefined || tag == "tries") {
		let triesDataString = getCookie("tries");
		
		if (triesDataString.length > 0) {
			let oldTry = currentTry;
			currentTry = "";
			let triesDataArray = triesDataString.split(",");
			for (let idx = 0; idx < triesDataArray.length; idx++) {
				let toTry = triesDataArray[idx];
				writeWord(toTry);
				writeToTry("ENTER", true); // true for cookieMode
			}
			currentTry = oldTry;
		}
	}
	
	if (tag === undefined || tag === "currentTry") {
		let currentTryData = getCookie("currentTry");
		currentTry = "";
		writeWord(currentTryData);
	}
	
	if (tag === undefined || tag === "gameOver") {
		let gameOverData = getCookie("gameOver");
		if (gameOverData !== undefined && gameOverData !== "") {
			gameOver = parseBool(gameOverData);
			
			if (gameOver) {
				postGameNotify();
			}
		}
	}
}

function saveData(tag, value) {
	if (tag === undefined || tag === "darkTheme") {
		setCookie("darkTheme", darkTheme);
	}
	if (tag === undefined || tag === "portalColors") {
		setCookie("portalColors", portalColors);
	}
	if (tag === undefined || tag === "tries") {
		setCookie("tries", tries.join(","));
	}
	if (tag === undefined || tag === "stats") {
		setCookie("stats", stats.join(","));
	}
	if (tag === undefined || tag === "gameNumber") {
		setCookie("gameNumber", gameNumber);
	}
	if (tag === undefined || tag === "lastGame") {
		setCookie("lastGame", lastGame);
	}
	if (tag === undefined || tag === "gameOver") {
		setCookie("gameOver", gameOver);
	}
	if (tag === undefined || tag === "firstGame") {
		setCookie("firstGame", firstGame);
	}
	if (tag === undefined || tag === "currentStreak") {
		setCookie("currentStreak", currentStreak);
	}
	if (tag === undefined || tag === "maxStreak") {
		setCookie("maxStreak", maxStreak);
	}
	if (tag === undefined || tag === "currentTry") {
		setCookie("currentTry", currentTry);
	}
	if (tag !== undefined && value !== undefined) {
		setCookie(tag, value)
	}
}

function getCookie(cname) { // Thanks, W3Schools!
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function setCookie(cname, cvalue, exdays = 9999) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/; SameSite=Lax";
}
