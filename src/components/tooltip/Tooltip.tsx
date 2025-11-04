import type { ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { TooltipContentProps } from '@radix-ui/react-tooltip';
import './tooltip.scss';

export interface TooltipProps {
	readonly content: ReactNode;
	readonly children: ReactNode;
	readonly delayDuration?: number;
	readonly side?: TooltipContentProps['side'];
	readonly align?: TooltipContentProps['align'];
	readonly sideOffset?: number;
}

export default function Tooltip({
	content,
	children,
	delayDuration = 250,
	side = 'top',
	align = 'center',
	sideOffset = 6,
}: TooltipProps) {
	return (
		<RadixTooltip.Provider delayDuration={delayDuration}>
			<RadixTooltip.Root>
				<RadixTooltip.Trigger asChild>
					<span className="app-tooltip-trigger">{children}</span>
				</RadixTooltip.Trigger>
				<RadixTooltip.Portal>
					<RadixTooltip.Content
						className="app-tooltip-content"
						side={side}
						align={align}
						sideOffset={sideOffset}
					>
						{content}
						<RadixTooltip.Arrow className="app-tooltip-arrow" width={10} height={5} />
					</RadixTooltip.Content>
				</RadixTooltip.Portal>
			</RadixTooltip.Root>
		</RadixTooltip.Provider>
	);
}
