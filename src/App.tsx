import emailjs from "@emailjs/browser";
import { useState, useEffect, useRef } from "react";
import ScatterGame from "./Scatter";
import "./App.css";

// ============================================================================
// GIF PLACEHOLDER CONSTANTS - Replace these URLs with your own GIFs
// ============================================================================
const GIFS = {
	propose: "https://media.giphy.com/media/QsomqbDcRm9xMFxJMu/giphy.gif",
	areYouSure: "https://media.giphy.com/media/7AzEXdIb1wyCTWJntb/giphy.gif",
	threat: "https://media.giphy.com/media/y93x7gLXTO5dnSWCEI/giphy.gif",
	mwehehehe: "https://media.giphy.com/media/3I8H8VvG9D7FRqd92Q/giphy.gif",
	dogDate: "https://media.giphy.com/media/WK7omsLop0431tZjXb/giphy.gif",
};

function generateRandom16(): string {
	const characters =
		"!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	return Array.from({ length: 16 }, () =>
		characters.charAt(Math.floor(Math.random() * characters.length)),
	).join("");
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type Screen =
	| "initial"
	| "captcha"
	| "areYouSure"
	| "mathChallenge"
	| "genderQuestion"
	| "scatterGame"
	| "finalQuestion"
	| "dateSelection"
	| "finalConfirmation";

type Gender = "male" | "female" | "other" | "";

interface ScatterTile {
	id: number;
	value: "💖" | "💔" | "⭐";
	revealed: boolean;
}

interface AppState {
	currentScreen: Screen;
	noButtonDisabled: boolean;
	captchaInput: string;
	mathAnswer: string;
	selectedGender: Gender;
	yesButtonEnabled: boolean;
	yesButtonTimer: number;
	mathAttemptWrong: boolean;
	noButtonPosition: { x: number; y: number };
	scatterTiles: ScatterTile[];
	scatterRevealed: number;
	scatterHearts: number;
	scatterGameOver: boolean;
	scatterWon: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const CAPTCHA_TOKEN = generateRandom16();
const MATH_N = 7; // Σ_{k=1}^{7} k = 28
const CORRECT_MATH_ANSWER = (MATH_N * (MATH_N + 1)) / 2; // Sum formula: n(n+1)/2
const FIXED_DATE = "2026-02-23";
const YES_BUTTON_DELAY = 15000; // 10 seconds in milliseconds

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function App() {
	const [state, setState] = useState<AppState>({
		currentScreen: "initial",
		noButtonDisabled: false,
		captchaInput: "",
		mathAnswer: "",
		selectedGender: "",
		yesButtonEnabled: false,
		yesButtonTimer: 0,
		mathAttemptWrong: false,
		noButtonPosition: { x: 50, y: 50 },
		scatterTiles: [],
		scatterRevealed: 0,
		scatterHearts: 0,
		scatterGameOver: false,
		scatterWon: false,
	});

	const captchaCanvasRef = useRef<HTMLCanvasElement>(null);

	// Initialize scatter game when entering that screen
	useEffect(() => {
		if (
			state.currentScreen === "scatterGame" &&
			state.scatterTiles.length === 0
		) {
			initializeScatterGame();
		}
	}, [state.currentScreen]);

	// Initialize the scatter game board
	const initializeScatterGame = () => {
		// Create 12 tiles (4x3 grid)
		const tiles: ScatterTile[] = [];

		// We need 3 hearts to win, add 5 hearts total, 2 stars, 5 broken hearts
		const values: Array<"💖" | "💔" | "⭐"> = [
			"💖",
			"💖",
			"💖",
			"💖",
			"💖", // 5 hearts
			"⭐",
			"⭐", // 2 stars (bonus)
			"💔",
			"💔",
			"💔",
			"💔",
			"💔", // 5 broken hearts (lose)
		];

		// Shuffle array
		for (let i = values.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[values[i], values[j]] = [values[j], values[i]];
		}

		// Create tiles
		for (let i = 0; i < 12; i++) {
			tiles.push({
				id: i,
				value: values[i],
				revealed: false,
			});
		}

		setState((prev) => ({
			...prev,
			scatterTiles: tiles,
			scatterRevealed: 0,
			scatterHearts: 0,
			scatterGameOver: false,
			scatterWon: false,
		}));
	};

	// Generate captcha image on canvas
	useEffect(() => {
		if (state.currentScreen === "captcha" && captchaCanvasRef.current) {
			const canvas = captchaCanvasRef.current;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// Set canvas size
			canvas.width = 300;
			canvas.height = 100;

			// Background with gradient
			const gradient = ctx.createLinearGradient(
				0,
				0,
				canvas.width,
				canvas.height,
			);
			gradient.addColorStop(0, "#f0f0f0");
			gradient.addColorStop(1, "#e0e0e0");
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Add noise lines
			ctx.strokeStyle = "#cccccc";
			ctx.lineWidth = 1;
			for (let i = 0; i < 8; i++) {
				ctx.beginPath();
				ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
				ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
				ctx.stroke();
			}

			// Add noise dots
			ctx.fillStyle = "#dddddd";
			for (let i = 0; i < 100; i++) {
				ctx.fillRect(
					Math.random() * canvas.width,
					Math.random() * canvas.height,
					2,
					2,
				);
			}

			// Draw captcha text with distortion
			const text = CAPTCHA_TOKEN;
			const fontSize = 24;
			ctx.font = `bold ${fontSize}px "Courier New", monospace`;

			let x = 20;
			for (let i = 0; i < text.length; i++) {
				ctx.save();

				// Random rotation and position offset for each character
				const rotation = (Math.random() - 0.5) * 0.4;
				const yOffset = Math.random() * 10 - 5;

				ctx.translate(x, 50 + yOffset);
				ctx.rotate(rotation);

				// Random color for each character (shades of pink/red)
				const colors = ["#ff1493", "#ff69b4", "#c71585", "#ff1493", "#db7093"];
				ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

				// Add shadow for depth
				ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
				ctx.shadowBlur = 2;
				ctx.shadowOffsetX = 1;
				ctx.shadowOffsetY = 1;

				ctx.fillText(text[i], 0, 0);
				ctx.restore();

				// Variable spacing
				x += ctx.measureText(text[i]).width + Math.random() * 5;
			}

			// Add more interference lines on top
			ctx.strokeStyle = "rgba(255, 20, 147, 0.3)";
			ctx.lineWidth = 2;
			for (let i = 0; i < 3; i++) {
				ctx.beginPath();
				ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
				ctx.bezierCurveTo(
					Math.random() * canvas.width,
					Math.random() * canvas.height,
					Math.random() * canvas.width,
					Math.random() * canvas.height,
					Math.random() * canvas.width,
					Math.random() * canvas.height,
				);
				ctx.stroke();
			}
		}
	}, [state.currentScreen]);

	// Timer effect for Yes button on areYouSure screen
	useEffect(() => {
		if (state.currentScreen === "areYouSure" && !state.yesButtonEnabled) {
			const startTime = Date.now();
			const interval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(0, YES_BUTTON_DELAY - elapsed);

				if (remaining === 0) {
					setState((prev) => ({ ...prev, yesButtonEnabled: true }));
					clearInterval(interval);
				} else {
					setState((prev) => ({
						...prev,
						yesButtonTimer: Math.ceil(remaining / 1000),
					}));
				}
			}, 100);

			return () => clearInterval(interval);
		}
	}, [state.currentScreen, state.yesButtonEnabled]);

	// ==========================================================================
	// HANDLERS
	// ==========================================================================

	// Reset everything
	const handleReset = () => {
		setState({
			currentScreen: "initial",
			noButtonDisabled: false,
			captchaInput: "",
			mathAnswer: "",
			selectedGender: "",
			yesButtonEnabled: false,
			yesButtonTimer: 0,
			mathAttemptWrong: false,
			noButtonPosition: { x: 50, y: 50 },
			scatterTiles: [],
			scatterRevealed: 0,
			scatterHearts: 0,
			scatterGameOver: false,
			scatterWon: false,
		});
	};

	//Handle email

	const handleSendEmail = async () => {
		try {
			emailjs.send(
				process.env.EMAILJS_SERVICE_ID!,
				process.env.EMAILJS_TEMPLATE_ID!,
				{
					to_email: process.env.RECIPIENT_EMAIL!,
					message: `Jenepher Apuya has accepted your Valentine's invitation! 🎉`,
					timestamp: new Date().toLocaleString(),
					name: "Valentine's Invitation",
				},
				process.env.EMAILJS_PUBLIC_KEY,
			);

			console.log("Email Sent");
		} catch (error) {
			handleReset();
			console.error("Failed to send Start Over email:", error);
		}
		handleReset();
	};

	// Handle initial "Yes" click - proceed directly to date selection
	const handleInitialYes = () => {
		setState((prev) => ({ ...prev, currentScreen: "dateSelection" }));
	};

	// Handle initial "No" click - disable No button and show captcha
	const handleInitialNo = () => {
		setState((prev) => ({
			...prev,
			noButtonDisabled: true,
			currentScreen: "captcha",
		}));
	};

	// Handle captcha submission - verify token and proceed
	const handleCaptchaSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (state.captchaInput.trim() === CAPTCHA_TOKEN) {
			setState((prev) => ({
				...prev,
				currentScreen: "areYouSure",
				yesButtonEnabled: false,
				yesButtonTimer: 10,
			}));
		}
	};

	// Handle "Are you sure?" screen - No button is disabled, only Yes proceeds
	const handleAreYouSureYes = () => {
		setState((prev) => ({ ...prev, currentScreen: "scatterGame" }));
	};

	// Handle math challenge submission
	const handleMathSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const userAnswer = parseInt(state.mathAnswer, 10);

		if (userAnswer === CORRECT_MATH_ANSWER) {
			// Correct answer - proceed to final question (ask again)
			setState((prev) => ({ ...prev, currentScreen: "finalQuestion" }));
		} else {
			// Incorrect answer - mark as wrong and ask for gender
			setState((prev) => ({ ...prev, mathAttemptWrong: true }));
		}
	};

	// Handle gender selection - IMPROVED VERSION
	const handleGenderSelect = (gender: Gender) => {
		// Update state to show selected gender and switch to gender question screen
		setState((prev) => ({
			...prev,
			selectedGender: gender,
			currentScreen: "genderQuestion", // Ensure feedback screen is shown
		}));

		if (gender === "female") {
			// Female users - show "correct" message then proceed to final question
			setTimeout(() => {
				setState((prev) => ({ ...prev, currentScreen: "finalQuestion" }));
			}, 2000);
		} else {
			// Male/Other users - show feedback message then reset to beginning
			setTimeout(() => {
				handleReset();
			}, 2000);
		}
	};

	// Handle final date confirmation
	const handleDateConfirm = () => {
		setState((prev) => ({ ...prev, currentScreen: "finalConfirmation" }));
	};

	// Handle scatter game tile click
	const handleScatterTileClick = (tileId: number) => {
		if (state.scatterGameOver) return;

		const tile = state.scatterTiles.find((t) => t.id === tileId);
		if (!tile || tile.revealed) return;

		// Reveal the tile
		const newTiles = state.scatterTiles.map((t) =>
			t.id === tileId ? { ...t, revealed: true } : t,
		);

		let newHearts = state.scatterHearts;
		let gameOver = false;
		let won = false;

		// Check what was revealed
		if (tile.value === "💔") {
			newHearts++;
			// Need 3 hearts to win
			if (newHearts >= 3) {
				gameOver = true;
				won = true;
			}
		} else if (tile.value === "💖") {
			// Hit a broken heart - game over, lose
			gameOver = true;
			won = false;
		}
		// Stars (⭐) do nothing, just safe tiles

		setState((prev) => ({
			...prev,
			scatterTiles: newTiles,
			scatterRevealed: prev.scatterRevealed + 1,
			scatterHearts: newHearts,
			scatterGameOver: gameOver,
			scatterWon: won,
		}));
	};

	// Handle scatter game continue after win
	const handleScatterContinue = () => {
		setState((prev) => ({ ...prev, currentScreen: "mathChallenge" }));
	};

	// Handle scatter game retry after loss
	const handleScatterRetry = () => {
		initializeScatterGame();
	};

	// Handle final question Yes - proceed to date
	const handleFinalQuestionYes = () => {
		setState((prev) => ({ ...prev, currentScreen: "dateSelection" }));
	};

	// Handle final question No - move the button randomly
	const handleFinalQuestionNoHover = () => {
		const maxX = 80; // Leave margin for button
		const maxY = 70;
		const newX = Math.random() * maxX;
		const newY = Math.random() * maxY;

		setState((prev) => ({
			...prev,
			noButtonPosition: { x: newX, y: newY },
		}));
	};

	// ==========================================================================
	// SCREEN RENDERERS
	// ==========================================================================

	const renderInitialScreen = () => (
		<div className="card" role="main" aria-labelledby="main-question">
			<img
				src={GIFS.propose}
				alt="Valentine's celebration animation"
				className="gif"
			/>
			<h1 id="main-question" className="title">
				💕 Will you be my Valentine? 💕
			</h1>

			<p className="subtitle">I promise it'll be worth it!</p>

			<div className="button-group">
				<button
					className="btn btn-yes"
					onClick={handleInitialYes}
					aria-label="Accept Valentine invitation"
				>
					Yes! 💖
				</button>
				<button
					className="btn btn-no"
					onClick={handleInitialNo}
					disabled={state.noButtonDisabled}
					aria-label="Decline Valentine invitation"
					aria-disabled={state.noButtonDisabled}
				>
					{state.noButtonDisabled ? "No (Unavailable)" : "No"}
				</button>
			</div>
		</div>
	);

	const renderCaptchaScreen = () => (
		<div className="card" role="main" aria-labelledby="captcha-title">
			<h2 id="captcha-title" className="title">
				🤖 Human Verification
			</h2>
			<p className="subtitle">
				Please prove you're human by entering the EXACT code below:
			</p>
			<p className="subtitle-warning">
				⚠️ Case-sensitive! Type exactly as shown!
			</p>

			<div className="captcha-container" aria-label="Captcha code">
				<canvas
					ref={captchaCanvasRef}
					className="captcha-canvas"
					aria-label="Distorted captcha text"
				/>
				<div className="captcha-instructions">
					<small>Enter the text you see above</small>
				</div>
			</div>

			<form onSubmit={handleCaptchaSubmit} className="form">
				<label htmlFor="captcha-input" className="sr-only">
					Enter captcha code
				</label>
				<input
					id="captcha-input"
					type="text"
					className="input"
					value={state.captchaInput}
					onChange={(e) =>
						setState((prev) => ({ ...prev, captchaInput: e.target.value }))
					}
					placeholder="Type the characters shown"
					aria-required="true"
					autoComplete="off"
					autoFocus
				/>
				<button type="submit" className="btn btn-primary">
					Verify
				</button>
			</form>
		</div>
	);

	const renderAreYouSureScreen = () => (
		<div className="card" role="main" aria-labelledby="confirm-title">
			<h2 id="confirm-title" className="title">
				🥺 Are you sure?
			</h2>

			<img
				src={GIFS.areYouSure}
				alt="Please reconsider animation"
				className="gif"
			/>

			<p className="subtitle">Kawawa naman ako 🥹</p>

			{!state.yesButtonEnabled && (
				<p className="timer-warning">
					⏳ Please wait {state.yesButtonTimer} seconds to reconsider...
				</p>
			)}

			<div className="button-group">
				<button
					className="btn btn-yes"
					onClick={handleAreYouSureYes}
					disabled={!state.yesButtonEnabled}
					aria-label={
						state.yesButtonEnabled
							? "Confirm acceptance"
							: `Wait ${state.yesButtonTimer} seconds`
					}
					aria-disabled={!state.yesButtonEnabled}
				>
					{state.yesButtonEnabled
						? "Ayoko sa'yo! 😠 "
						: `Yes (Wait ${state.yesButtonTimer}s)`}
				</button>
				<button
					className="btn btn-secondary"
					onClick={handleAreYouSureYes}
					aria-label="Continue to next step"
				>
					Sige na lang, I love you 💕
				</button>
			</div>
		</div>
	);

	const renderMathChallengeScreen = () => (
		<div className="card" role="main" aria-labelledby="math-title">
			<h2 id="math-title" className="title">
				🧮 Math Challenge
			</h2>
			<p className="subtitle">Solve this to proceed...</p>

			<div className="math-problem" aria-label="Math equation">
				<p className="math-text">
					Calculate:
					<span className="math-equation">
						<span className="math-symbol">Σ</span>
						<sub>k=1</sub>
						<sup>{MATH_N}</sup> k
					</span>
				</p>
			</div>

			{state.mathAttemptWrong && (
				<div className="error-message">
					<p className="error-text">❌ Your answer is wrong!</p>
					<p className="subtitle">Choose your gender to continue:</p>
					<div className="button-group-vertical">
						<button
							className="btn btn-secondary"
							onClick={() => handleGenderSelect("female")}
							aria-label="Select female"
						>
							Female
						</button>
						<button
							className="btn btn-secondary"
							onClick={() => handleGenderSelect("male")}
							aria-label="Select male"
						>
							Male
						</button>
						<button
							className="btn btn-secondary"
							onClick={() => handleGenderSelect("other")}
							aria-label="Select other"
						>
							Other
						</button>
					</div>
				</div>
			)}

			{!state.mathAttemptWrong && (
				<form onSubmit={handleMathSubmit} className="form">
					<label htmlFor="math-input" className="sr-only">
						Enter your answer
					</label>
					<input
						id="math-input"
						type="number"
						className="input"
						value={state.mathAnswer}
						onChange={(e) =>
							setState((prev) => ({ ...prev, mathAnswer: e.target.value }))
						}
						placeholder="Your answer"
						aria-required="true"
						autoFocus
					/>
					<button type="submit" className="btn btn-primary">
						Submit Answer
					</button>
				</form>
			)}
		</div>
	);

	const renderGenderQuestionScreen = () => (
		<div className="card" role="main" aria-labelledby="gender-title">
			<h2 id="gender-title" className="title">
				{state.selectedGender === "female"
					? "✅ Correct!"
					: state.selectedGender
						? "😊 Let's Try Again"
						: "🤔 Choose Your Gender"}
			</h2>

			{state.selectedGender === "female" ? (
				<p className="subtitle success-message">
					Perfect! Moving forward... 💕
				</p>
			) : state.selectedGender ? (
				<p className="subtitle">Restarting the adventure... 🔄</p>
			) : (
				<>
					<p className="subtitle">This will help us continue...</p>
					<div className="button-group-vertical">
						<button
							className="btn btn-secondary"
							onClick={() => handleGenderSelect("female")}
							aria-label="Select female"
						>
							Female
						</button>
						<button
							className="btn btn-secondary"
							onClick={() => handleGenderSelect("male")}
							aria-label="Select male"
						>
							Male
						</button>
						<button
							className="btn btn-secondary"
							onClick={() => handleGenderSelect("other")}
							aria-label="Select other"
						>
							Other
						</button>
					</div>
				</>
			)}
		</div>
	);

	const renderDateSelectionScreen = () => (
		<div className="card" role="main" aria-labelledby="date-title">
			<h2 id="date-title" className="title">
				When can I eat you? 🥰
			</h2>

			<p className="subtitle">I mean date you 😁</p>

			<div className="simple-date-picker">
				<label htmlFor="date-picker" className="date-label">
					Select a date:
				</label>
				<input
					id="date-picker"
					type="date"
					className="date-input-simple"
					value={FIXED_DATE}
					min={FIXED_DATE}
					max={FIXED_DATE}
					aria-label="Date selection"
				/>
			</div>

			<div className="gif-container">
				<img src={GIFS.mwehehehe} alt="Celebration animation" className="gif" />
			</div>

			<button
				className="btn btn-primary"
				onClick={handleDateConfirm}
				aria-label="Confirm date selection"
			>
				Confirm Date 💖
			</button>
		</div>
	);

	const renderFinalConfirmationScreen = () => (
		<div className="card" role="main" aria-labelledby="final-title">
			<h2 id="final-title" className="title">
				💝 It's a Date! 💝
			</h2>

			<img
				src={GIFS.dogDate}
				alt="Final celebration animation"
				className="gif"
			/>

			<p className="subtitle success-message">
				See you on <strong>February 23, 2026</strong>!
			</p>
			<p className="subtitle">
				ILOVEYOU LOVEEE 💕✨ Happy valentines day, Happy monthsary, and Happy
				Birthday all at once 💖💕 3 in 1 na sa muna 🥀
			</p>

			<button
				className="btn btn-secondary"
				onClick={handleSendEmail}
				style={{ marginTop: "2rem" }}
			>
				🔄 Start Over
			</button>
		</div>
	);

	const renderFinalQuestionScreen = () => (
		<div
			className="card final-question-card"
			role="main"
			aria-labelledby="final-q-title"
		>
			<div className="final-question-content">
				<div className="decorative-hearts-top">
					<span className="decorative-heart">💕</span>
					<span className="decorative-heart">💖</span>
					<span className="decorative-heart">💕</span>
				</div>

				<div className="gif-wrapper">
					<div className="gif-glow"></div>
					<div className="gif-container">
						<img
							src={GIFS.threat}
							alt="Valentine's proposal animation"
							className="gif"
						/>
					</div>
				</div>

				<div className="question-text-wrapper">
					<h2 id="final-q-title" className="title final-question-title">
						💖 One Last Time...
					</h2>
					<p className="subtitle final-question-subtitle">
						Will you be my Valentine?
					</p>
				</div>

				<div className="button-area">
					<div className="button-container-relative">
						<button
							className="btn btn-yes btn-yes-final"
							onClick={handleFinalQuestionYes}
							aria-label="Accept Valentine invitation"
						>
							<span className="button-icon">💕</span>
							Yes!
							<span className="button-sparkle">✨</span>
						</button>
						<button
							className="btn btn-no moving-button"
							onMouseEnter={handleFinalQuestionNoHover}
							onFocus={handleFinalQuestionNoHover}
							onClick={handleFinalQuestionNoHover}
							style={{
								position: "absolute",
								left: `${state.noButtonPosition.x}%`,
								top: `${state.noButtonPosition.y}%`,
								transition: "all 0.3s ease",
							}}
							aria-label="Try to decline (unclickable)"
						>
							No
						</button>
					</div>
				</div>

				<div className="hint-wrapper">
					<p className="hint-text">💡 Hint: The "No" button is a bit shy...</p>
				</div>

				<div className="decorative-hearts-bottom">
					<span className="decorative-heart">💝</span>
					<span className="decorative-heart">💗</span>
					<span className="decorative-heart">💝</span>
				</div>
			</div>
		</div>
	);

	// ==========================================================================
	// MAIN RENDER
	// ==========================================================================

	return (
		<div className="app-container">
			<div className="background-hearts" aria-hidden="true">
				{Array.from({ length: 15 }).map((_, i) => (
					<div
						key={i}
						className="heart"
						style={{
							left: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 5}s`,
						}}
					>
						❤️
					</div>
				))}
			</div>

			<main className="content">
				{state.currentScreen === "initial" && renderInitialScreen()}
				{state.currentScreen === "captcha" && renderCaptchaScreen()}
				{state.currentScreen === "areYouSure" && renderAreYouSureScreen()}
				{state.currentScreen === "scatterGame" && (
					<ScatterGame
						tiles={state.scatterTiles}
						revealed={state.scatterRevealed}
						hearts={state.scatterHearts}
						gameOver={state.scatterGameOver}
						won={state.scatterWon}
						onTileClick={handleScatterTileClick}
						onContinue={handleScatterContinue}
						onChange={handleReset}
						onRetry={handleScatterRetry}
					/>
				)}
				{state.currentScreen === "mathChallenge" && renderMathChallengeScreen()}
				{state.currentScreen === "genderQuestion" &&
					renderGenderQuestionScreen()}
				{state.currentScreen === "finalQuestion" && renderFinalQuestionScreen()}
				{state.currentScreen === "dateSelection" && renderDateSelectionScreen()}
				{state.currentScreen === "finalConfirmation" &&
					renderFinalConfirmationScreen()}
			</main>
		</div>
	);
}

export default App;
