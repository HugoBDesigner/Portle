var darkTheme = true;
var portalColors = true;
var gamePaused = false;
var gameOver = false;

var expiredSession = false;
const allowExpiration = false; // Wordle doesn't have expiration, but I may want to implement this eventually, who knows

const firstgameMilli = new Date(2022, 7, 22, 0, 0, 0, 0).getTime();
const dayLength = 1000*60*60*24;
var gameNumber;

let gameTimerNext;
var playedGames = 0;
var winPercent = 0;
var currentStreak = 0;
var maxStreak = 0;
var guessDist1, guessDist2, guessDist3, guessDist4, guessDist5, guessDist6;
var gameTimer = 0;

let wordOfTheDay;
let seed;
let lastGame;
let tries = [];
let tiles = [];
let keys = []
let currentTry = "";
let stats = [0,0,0,0,0,0,0]; // X, 1, 2, 3, 4, 5 and 6. This way, they even match the index!
const postGameMessages = [
	"", // X (no message, it'll be the word of the day) "How can you fail at this? It isn't even a test."
	"Congratulations!", // 1 "Congratulations. You are better than everyone."
	"Not bad!", // 2 "Not bad. I forgot how good you are at this."
	"Mildly impressive!", // 3 "That was genuinely mildly impressive."
	"Not completely bad!", // 4 "Very not completely bad."
	"Did well... enough.", // 5 "Did well... enough."
	"Disappointing.", // 6 "You're doing a great job of disappointing me."
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
	let hours = Math.floor(totalSeconds / 60 / 60);
	totalSeconds -= hours*60*60;
	let minutes = Math.floor(totalSeconds / 60);
	totalSeconds -= minutes*60;
	
	let text = addZeros(hours) + ":" + addZeros(minutes) + ":" + addZeros(totalSeconds);
	
	gameTimer = text;
}

function getYesterday() {
	let date = new Date();
	date.setDate(date.getDate() - 1);
	return getDateString(date);
}

function getDateString(date = new Date()) {
	let dateString = date.toLocaleString(undefined, {year:"numeric"}) + date.toLocaleString(undefined, {month:"2-digit"}) + date.toLocaleString(undefined, {day:"2-digit"});
	//2022 + 06 + 26 -> 20220626
	return dateString; // Used to use ISO String with RegEx, but that changes the timezone
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
	seed = getDateString();
	//20220626
	console.log(seed);
	wordOfTheDay = getWordOfTheDay(seed);
	// console.log(wordOfTheDay);
	
	loadData("lastGame");
	if (lastGame === undefined) {
		lastGame = gameNumber;
	} else if (lastGame - gameNumber > 1) {
		currentStreak = 0;
		saveData("currentStreak");
	}
	
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
	
	gameTimerNext = new Date();
	gameTimerNext.setDate(gameTimerNext.getDate() + 1);
	getAbsoluteDate(gameTimerNext);
}

document.addEventListener("keydown", keyboardInput);

function keyboardInput(event) {
	if (gamePaused) return;
	let key = event.key;
	
	if (key.match(/^[a-z]$/i) || key === "Enter" || key === "Backspace") {
		writeToTry(key.toUpperCase());
	}
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
			
			tile.removeChild(tile.lastChild);
			tile.classList.remove("black-filling");
			tile.classList.add("empty");
			if (!cookieMode) saveData("currentTry");
		}
	} else if (currentTry.length < 10) {
		currentTry += letter;
		
		let tile = getTile();
		
		tile.appendChild(document.createTextNode(letter));
		tile.classList.add("black-filling");
		tile.classList.remove("empty");
		if (!cookieMode) saveData("currentTry");
	}
}

function processWord(cookieMode = false) {
	if (currentTry.length < 4) {
		notify("Word is too small!");
	} else {
		if (wordList.includes(currentTry)) {
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
			if (!cookieMode) saveData("tries");
			if (!cookieMode) saveData("currentTry");
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
	document.getElementById("board").appendChild(board);
	
	initializeKeyboard();
	loadData();
	// toggleMenu(); // DEBUG
}

function initializeKeyboard() {
	let keyboard = document.createElement("div");
	keyboard.classList.add("keyboard-inner");
	
	let letters = ["QWERTYUIOP"," ASDFGHJKL ","*ZXCVBNM*"];
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
				button = document.createElement("a");
				
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
	let func = mulberry32(seed * 17);
	let num = Math.floor(func() * wordList.length);
	return wordList[num];
}

// Called when the game ends for the first time.
// That is, when the player hits enter on the last word.
// So it processes stuff like streaks and saves some data.
function postGameProcess() {
	let gameScore = postGameScore();
	
	postGameNotify(true); // true for "justWon"
	
	gameOver = true;
	saveData("gameOver");
	
	currentStreak++;
	maxStreak = Math.max(currentStreak, maxStreak);
	saveData("currentStreak");
	saveData("maxStreak");
	
	lastGame = gameNumber;
	saveData("lastGame");
	
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
	} else {
		notificationMessage = postGameMessages[gameScore];
	}
	notify(notificationMessage);
	
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
	document.getElementById("menu").show();
	gamePaused = true;
}

function showStats() {
	if (gamePaused) {
		// No need to show twice
		return;
	}

	guessDistMax = 0;
	playedGames = 0;
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
	
	document.getElementById("gameTimer").update();
	document.getElementById("shareContainer").update();
	
	gamePaused = true;
	document.getElementById("stats").show();
}

function showHowto() {
	document.getElementById("howto").show();
	gamePaused = true;
}

function showAbout() {
	document.getElementById("about").show();
	gamePaused = true;
}

function unpauseGame() {
	console.log("UNPAUSING!");
	gamePaused = false;
}

function toggleDarkTheme(cookieMode = false) {
	console.log("Dark theme: " + darkTheme);
	if (darkTheme) {
		console.log("TRUE");
		document.getElementsByTagName("body")[0].classList.remove("lightTheme");
	} else {
		console.log("FALSE");
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
	if (tag === undefined || tag === "currentStreak") {
		setCookie("currentStreak", currentStreak);
	}
	if (tag === undefined || tag === "maxStreak") {
		setCookie("maxStreak", maxStreak);
	}
	if (tag === undefined || tag === "currentTry") {
		setCookie("currentTry", currentTry);
	}
	if (tag === undefined || tag === "gameOver") {
		setCookie("gameOver", gameOver);
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
