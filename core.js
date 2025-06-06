(function(Scratch){
const storageKey = "heart-attack-v8:local-storage";

function readFromStorage() {
	try {
		const data = localStorage.getItem(storageKey);
		if (data) {
			const parsed = JSON.parse(data);
			if (parsed && parsed.data) {
				const processed = {};
				for (const [key, value] of Object.entries(parsed.data)) {
					if (
						typeof value === "number" ||
						typeof value === "string" ||
						typeof value === "boolean"
					) {
						processed[key] = value;
					}
				}
				return processed;
			}
		}
	} catch (error) {
		console.error("error reading from local storage", error);
	}
	return {};
}

function saveToStorage(data) {
	try {
		if (Object.keys(data).length > 0) {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					time: Math.round(Date.now() / 1000),
					data,
				})
			);
		} else {
			localStorage.removeItem(storageKey);
		}
	} catch (error) {
		console.error("error saving to local storage", error);
	}
}

let champion = "";
let highscore = 0;
let connected = false;
let fetchResolve = null;
let ws = null;

class HeartAttack {
	getInfo() {
		return {
			id: 'heartattack',
			name: 'Heart Attack',
			color1: '#88738E',
			color2: '#554859',
			blocks: [
				{ opcode: 'init', blockType: 'command', text: 'initialize' },
				{ opcode: 'isConnected', blockType: 'Boolean', text: 'connected?' },
				{ opcode: 'gf', blockType: 'command', text: 'green flag' },
				{ opcode: 'top', blockType: 'reporter', text: 'top player' },
				{ opcode: 'high', blockType: 'reporter', text: 'top highscore' },
				{
					opcode: 'new',
					blockType: 'command',
					text: 'new highscore [NAME] [SCORE]',
					arguments: { NAME: { type: 'string' }, SCORE: { type: 'number' } }
				},
				{
					opcode: 'getKey',
					blockType: 'reporter',
					text: 'key [KEY]',
					arguments: { KEY: { type: 'string' } },
					disableMonitor: true
				},
				{
					opcode: 'setKey',
					blockType: 'command',
					text: 'set key [KEY] to [VAL]',
					arguments: {
						KEY: { type: 'string' },
						VAL: { type: 'string' },
					}
				},
				{ opcode: 'deleteKeys', blockType: 'command', text: 'delete all keys' },
			]
		};
	}

	init() {
		if (connected || ws) return;

		ws = new WebSocket("wss://heartattackws.glitch.me/");

		ws.addEventListener("open", () => {
			connected = true;
		});

		ws.addEventListener("message", (e) => {
			const [name, score] = e.data.split(",");
			if (name && score) {
				champion = name;
				highscore = parseInt(score);
				console.log(`"${champion}", ${highscore}`);
				
				if (fetchResolve) {
					fetchResolve();
					fetchResolve = null;
				}
			}
		});

		ws.addEventListener("close", () => {
			connected = false;
			ws = null;
		});
	}

	getKey({KEY}) {
		const storage = readFromStorage();
		if (!Object.prototype.hasOwnProperty.call(storage, KEY)) {
			return "";
		}
		return storage[KEY];
	}

	setKey({KEY, VAL}) {
		const storage = readFromStorage();
		storage[KEY] = VAL;
		saveToStorage(storage);
	}

	deleteKeys() { saveToStorage({}) }
	new({NAME, SCORE}) { if (connected && ws) ws.send(`${NAME || ""},${SCORE}`) }
	gf() { Scratch.vm.runtime.greenFlag() }
	isConnected() { return connected }
	top() { return champion }
	high() { return highscore }
}

Scratch.extensions.register(new HeartAttack());
})(Scratch);