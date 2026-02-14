import React from "react";

interface ScatterTile {
	id: number;
	value: "💖" | "💔" | "⭐";
	revealed: boolean;
}

interface ScatterGameProps {
	tiles: ScatterTile[];
	revealed: number;
	hearts: number; // Now represents count of broken hearts found
	gameOver: boolean;
	won: boolean;
	onTileClick: (id: number) => void;
	onContinue: () => void;
	onRetry: () => void;
	onChange: () => void;
}

const ScatterGame: React.FC<ScatterGameProps> = ({
	tiles,
	revealed,
	hearts,
	gameOver,
	won,
	onTileClick,
	onContinue,
	onRetry,
	onChange,
}) => {
	return (
		<div
			className="card scatter-card"
			role="main"
			aria-labelledby="scatter-title"
		>
			<h2 id="scatter-title" className="title">
				🎰 Broken Hearts Game
			</h2>
			<p className="subtitle">
				Kung ayaw mo, Win the game to break my heart. Find 3 broken hearts (💔)
				to win!
			</p>

			<div className="scatter-info">
				<div className="scatter-stat">
					<span className="stat-label">Broken Hearts Found:</span>
					<span className="stat-value">{hearts} / 3</span>
				</div>
				<div className="scatter-stat">
					<span className="stat-label">Tiles Revealed:</span>
					<span className="stat-value">{revealed} / 12</span>
				</div>
			</div>

			<div className="scatter-legend">
				<span>💔 Broken Hearts (Find 3!)</span>
				<span>💖 Hearts (Lose)</span>
				<span>⭐ Safe</span>
			</div>

			<div className="scatter-grid" role="grid">
				{tiles.map((tile) => (
					<button
						key={tile.id}
						className={`scatter-tile ${tile.revealed ? "revealed" : ""} ${
							tile.revealed && tile.value === "💖" ? "heart" : ""
						} ${tile.revealed && tile.value === "💔" ? "broken" : ""} ${
							tile.revealed && tile.value === "⭐" ? "star" : ""
						}`}
						onClick={() => onTileClick(tile.id)}
						disabled={tile.revealed || gameOver}
						aria-label={
							tile.revealed
								? `Revealed: ${tile.value}`
								: `Hidden tile ${tile.id + 1}`
						}
					>
						{tile.revealed ? (
							<span className="tile-icon">{tile.value}</span>
						) : (
							<span className="tile-hidden">❓</span>
						)}
					</button>
				))}
			</div>

			{gameOver && (
				<div className={`scatter-result ${won ? "win" : "lose"}`}>
					{won ? (
						<>
							<h3 className="result-title">💔 You Won!</h3>
							<p className="result-text">Aray ko Pakak...</p>
							<button className="btn btn-primary" onClick={onContinue}>
								Okay wag na lang 💔
							</button>
						</>
					) : (
						<>
							<h3 className="result-title">💖 Uh oh!</h3>
							<p className="result-text">
								You won a date instead! Better luck next time? 😉
							</p>
							<button className="btn btn-primary" onClick={onChange}>
								Let's Date!!🌹
							</button>
							<button className="btn btn-secondary try-again" onClick={onRetry}>
								Try Again 🔄
							</button>
						</>
					)}
				</div>
			)}

			{!gameOver && (
				<p className="scatter-hint">
					💡 Click tiles to reveal them. Avoid hearts (💖)!
				</p>
			)}
		</div>
	);
};

export default ScatterGame;
