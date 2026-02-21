import { GitHubCalendar } from "react-github-calendar";

export const GitHubHeatmap = () => {
	return (
		<div className="w-full overflow-x-auto hide-scrollbar">
			<div className="min-w-135 lg:min-w-fit">
				<GitHubCalendar
					username="Killer545537"
					colorScheme="light"
					blockSize={8}
					blockMargin={3}
					blockRadius={1}
					fontSize={10}
					showMonthLabels={false}
					theme={{
						light: ["#f4f4f5", "#d1fae5", "#6ee7b7", "#34d399", "#059669"],
					}}
					labels={{
						totalCount: "{{count}} contributions in {{year}}",
						legend: {
							less: "Less",
							more: "More",
						},
					}}
					style={{
						color: "#a1a1aa",
						fontFamily: "ui-monospace, monospace",
					}}
				/>
			</div>
		</div>
	);
};
