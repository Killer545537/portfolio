export function GlobalStyles() {
    return (
        <style>
            {`
				@keyframes scroll {
					0% { transform: translateX(0); }
					100% { transform: translateX(-50%); }
				}

				.animate-scroll {
					animation: scroll 40s linear infinite;
				}

				.hide-scrollbar {
					-ms-overflow-style: none;
					scrollbar-width: none;
				}

				.hide-scrollbar::-webkit-scrollbar {
					display: none;
				}
			`}
        </style>
    );
}
