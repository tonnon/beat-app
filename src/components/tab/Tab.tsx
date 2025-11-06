import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import './tab.scss';

type TabsRootElement = ElementRef<typeof TabsPrimitive.Root>;
type TabsRootProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

export interface TabItem {
	readonly value: string;
	readonly label: ReactNode;
	readonly content: ReactNode;
	readonly disabled?: boolean;
	readonly triggerClassName?: string;
	readonly contentClassName?: string;
}

export interface TabProps extends Omit<TabsRootProps, 'defaultValue' | 'value' | 'onValueChange' | 'children'> {
	readonly items: ReadonlyArray<TabItem>;
	readonly defaultValue?: string;
	readonly value?: string;
	readonly onValueChange?: (value: string) => void;
	readonly rootClassName?: string;
	readonly listClassName?: string;
	readonly triggerClassName?: string;
	readonly contentClassName?: string;
}

const Tab = forwardRef<TabsRootElement, TabProps>(({
	items,
	defaultValue,
	value,
	onValueChange,
	rootClassName,
	listClassName,
	triggerClassName,
	contentClassName,
	orientation = 'horizontal',
	...rootProps
}, ref) => {
	const fallbackValue = items[0]?.value;
	const isControlled = value !== undefined;
	const valueProps = isControlled
		? { value, onValueChange }
		: { defaultValue: defaultValue ?? fallbackValue, onValueChange };

	const rootClasses = ['app-tab-root', rootClassName].filter(Boolean).join(' ');
	const listClasses = ['app-tab-list', listClassName].filter(Boolean).join(' ');
	const triggerBaseClassName = ['app-tab-trigger', triggerClassName].filter(Boolean).join(' ');
	const contentBaseClassName = ['app-tab-content', contentClassName].filter(Boolean).join(' ');

	return (
		<TabsPrimitive.Root
			ref={ref}
			orientation={orientation}
			className={rootClasses}
			{...valueProps}
			{...rootProps}
		>
			<TabsPrimitive.List className={listClasses}>
				{items.map((item) => (
					<TabsPrimitive.Trigger
						key={item.value}
						value={item.value}
						disabled={item.disabled}
						className={[triggerBaseClassName, item.triggerClassName].filter(Boolean).join(' ')}
					>
						{item.label}
					</TabsPrimitive.Trigger>
				))}
			</TabsPrimitive.List>

			{items.map((item) => (
				<TabsPrimitive.Content
					key={item.value}
					value={item.value}
					className={[contentBaseClassName, item.contentClassName].filter(Boolean).join(' ')}
				>
					{item.content}
				</TabsPrimitive.Content>
			))}
		</TabsPrimitive.Root>
	);
});

Tab.displayName = 'Tab';

export default Tab;
