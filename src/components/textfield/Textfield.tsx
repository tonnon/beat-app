import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
	InputHTMLAttributes,
	ReactNode,
	ForwardedRef,
	FormEventHandler,
	MutableRefObject,
	FocusEventHandler,
	KeyboardEventHandler,
} from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/ca';
import 'dayjs/locale/es';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { caES, esES } from '@mui/x-date-pickers/locales';
import * as PasswordToggleField from '@radix-ui/react-password-toggle-field';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useTranslation } from 'react-i18next';

import './textfield.scss';

const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY';

type SharedProps = {
	readonly id: string;
	readonly label: ReactNode;
	readonly description?: string;
	readonly wrapperClassName?: string;
	readonly error?: boolean;
	readonly labelSuffix?: ReactNode;
	readonly className?: string;
	readonly labelIcon?: ReactNode;
};

type DefaultTextfieldProps = SharedProps &
	InputHTMLAttributes<HTMLInputElement> & {
		readonly variant?: 'default';
	};

type DatePickerTextfieldProps = SharedProps & {
	readonly variant: 'date-picker';
	readonly value?: Date | null;
	readonly defaultValue?: Date;
	readonly onDateChange?: (value: Date | null) => void;
	readonly minDate?: Date;
	readonly maxDate?: Date;
	readonly required?: boolean;
	readonly disabled?: boolean;
	readonly placeholder?: string;
	readonly name?: string;
	readonly autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
	readonly inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
	readonly form?: string;
	readonly onInvalid?: FormEventHandler<HTMLInputElement>;
	readonly onInput?: FormEventHandler<HTMLInputElement>;
	readonly onBlur?: FocusEventHandler<HTMLInputElement>;
	readonly onFocus?: FocusEventHandler<HTMLInputElement>;
	readonly onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

export type TextfieldProps = DefaultTextfieldProps | DatePickerTextfieldProps;

function useForwardedRef(ref: ForwardedRef<HTMLInputElement>) {
	const innerRef = useRef<HTMLInputElement | null>(null);

	const handleRef = useCallback(
		(node: HTMLInputElement | null) => {
			innerRef.current = node;
			if (typeof ref === 'function') {
				ref(node);
			} else if (ref) {
				(ref as MutableRefObject<HTMLInputElement | null>).current = node;
			}
		},
		[ref],
	);

	return { innerRef, handleRef } as const;
}

function DefaultTextfield({
	id,
	label,
	description,
	wrapperClassName,
	className,
	error = false,
	labelSuffix,
	labelIcon,
	variant: _variant,
	onInvalid: inputOnInvalid,
	onInput: inputOnInput,
	forwardedRef,
	...inputProps
}: DefaultTextfieldProps & { readonly forwardedRef: ForwardedRef<HTMLInputElement> }) {
 void _variant;
	const { t } = useTranslation<'common'>('common');
	const [isInvalid, setIsInvalid] = useState(false);
	const { innerRef, handleRef } = useForwardedRef(forwardedRef);
	const fieldClass = `app-textfield${wrapperClassName ? ` ${wrapperClassName}` : ''}`;
	const inputClasses = ['app-textfield-input'];
	if (error || isInvalid) {
		inputClasses.push('app-textfield-input--error');
	}
	if (className) {
		inputClasses.push(className);
	}
	const inputClass = inputClasses.join(' ');
	const descriptionId = description ? `${id}-description` : undefined;
	const {
		type: inputType = 'text',
		required,
		disabled,
		autoComplete,
		...restInputProps
	} = inputProps;
	const isPasswordField = inputType === 'password';
	const isRequired = Boolean(required);
	const passwordAutoComplete = isPasswordField && (autoComplete === 'current-password' || autoComplete === 'new-password')
		? (autoComplete as 'current-password' | 'new-password')
		: undefined;

	const handleInvalid = useCallback<FormEventHandler<HTMLInputElement>>(
		(event) => {
			setIsInvalid(true);
			inputOnInvalid?.(event);
		},
		[inputOnInvalid],
	);

	const handleInput = useCallback<FormEventHandler<HTMLInputElement>>(
		(event) => {
			if (isInvalid) {
				setIsInvalid(false);
			}
			inputOnInput?.(event);
		},
		[inputOnInput, isInvalid],
	);

	useEffect(() => {
		const inputElement = innerRef.current;

		if (!inputElement) {
			return;
		}

		const form = inputElement.form;
		if (!form) {
			return;
		}

		const handleFormSubmit = () => {
			if (!innerRef.current) {
				return;
			}

			setIsInvalid(!innerRef.current.checkValidity());
		};

		form.addEventListener('submit', handleFormSubmit, true);

		return () => {
			form.removeEventListener('submit', handleFormSubmit, true);
		};
	}, [innerRef, required]);

	const passwordToggleAriaLabel = t('passwordToggle.ariaLabel');

	const inputElement = isPasswordField ? (
		<div className="app-textfield-password-toggle">
			<PasswordToggleField.Root>
				<PasswordToggleField.Input
					id={id}
					ref={handleRef}
					className={inputClass}
					aria-describedby={descriptionId}
					onInvalid={handleInvalid}
					onInput={handleInput}
					aria-invalid={error || isInvalid || undefined}
					required={required}
					disabled={disabled}
					autoComplete={passwordAutoComplete}
					{...restInputProps}
				/>
				<PasswordToggleField.Toggle
					id={`${id}-toggle`}
					className="app-textfield-password-toggle-button"
					disabled={disabled}
					aria-label={passwordToggleAriaLabel}
					aria-controls={id}
				>
					<PasswordToggleField.Icon
						className="app-textfield-password-toggle-icon"
						visible={<EyeOpenIcon aria-hidden="true" />}
						hidden={<EyeClosedIcon aria-hidden="true" />}
					/>
				</PasswordToggleField.Toggle>
			</PasswordToggleField.Root>
		</div>
	) : (
		<input
			id={id}
			ref={handleRef}
			className={inputClass}
			aria-describedby={descriptionId}
			onInvalid={handleInvalid}
			onInput={handleInput}
			aria-invalid={error || isInvalid || undefined}
			type={inputType}
			required={required}
			disabled={disabled}
			autoComplete={autoComplete}
			{...restInputProps}
		/>
	);

	return (
		<div className={fieldClass}>
			<div className="app-textfield-label-wrapper">
				<label className="app-textfield-label" htmlFor={id}>
						<span className="app-textfield-label-content">
							<span className="app-textfield-label-text">
								{label}
								{isRequired ? (
									<span aria-hidden="true" className="app-textfield-required-indicator">
										*
									</span>
								) : null}
							</span>
							{labelIcon ? (
								<span className="app-textfield-label-icon">
									{labelIcon}
								</span>
							) : null}
						</span>
				</label>
				{labelSuffix ? (
					<span className="app-textfield-label-suffix">{labelSuffix}</span>
				) : null}
			</div>

			{inputElement}

			{description ? (
				<p id={descriptionId} className="app-textfield-description">
					{description}
				</p>
			) : null}
		</div>
	);
}

function DatePickerTextfield({
	id,
	label,
	description,
	wrapperClassName,
	className,
	error = false,
	labelSuffix,
	labelIcon,
	variant: _variant,
	value,
	defaultValue,
	onDateChange,
	minDate,
	maxDate,
	required,
	disabled,
	placeholder,
	name,
	autoComplete,
	inputMode,
	form,
	onInvalid: inputOnInvalid,
	onInput: inputOnInput,
	onKeyDown,
	forwardedRef,
}: DatePickerTextfieldProps & { readonly forwardedRef: ForwardedRef<HTMLInputElement> }) {
 void _variant;
	const { i18n } = useTranslation();
	const [isInvalid, setIsInvalid] = useState(false);
	const { innerRef, handleRef } = useForwardedRef(forwardedRef);

	const isControlled = value !== undefined;

	const initialValue = useMemo<Dayjs | null>(() => {
		if (value !== undefined) {
			return value ? dayjs(value) : null;
		}
		if (defaultValue) {
			return dayjs(defaultValue);
		}
		return null;
	}, [defaultValue, value]);

	const [internalValue, setInternalValue] = useState<Dayjs | null>(initialValue);

	useEffect(() => {
		if (isControlled) {
			return;
		}

		if (defaultValue !== undefined) {
			setInternalValue(defaultValue ? dayjs(defaultValue) : null);
		}
	}, [defaultValue, isControlled]);

	const pickerValue = useMemo<Dayjs | null>(() => {
		if (isControlled) {
			return value ? dayjs(value) : null;
		}
		return internalValue;
	}, [internalValue, isControlled, value]);

	const minDateValue = useMemo(() => (minDate ? dayjs(minDate) : undefined), [minDate]);
	const maxDateValue = useMemo(() => (maxDate ? dayjs(maxDate) : undefined), [maxDate]);

	const adapterLocale = useMemo(() => {
		const language = i18n.language;
		if (language.startsWith('ca')) {
			return 'ca';
		}
		if (language.startsWith('es')) {
			return 'es';
		}
		return 'es';
	}, [i18n.language]);

	const localeText = useMemo(() => {
		if (i18n.language.startsWith('ca')) {
			return caES.components?.MuiLocalizationProvider?.defaultProps?.localeText;
		}
		return esES.components?.MuiLocalizationProvider?.defaultProps?.localeText;
	}, [i18n.language]);

	useEffect(() => {
		dayjs.locale(adapterLocale);
	}, [adapterLocale]);

	const fieldClassNames = ['app-textfield', 'app-textfield--date-picker'];
	if (wrapperClassName) {
		fieldClassNames.push(wrapperClassName);
	}
	const fieldClass = fieldClassNames.join(' ');

	const inputClasses = ['app-textfield-input'];
	if (error || isInvalid) {
		inputClasses.push('app-textfield-input--error');
	}
	if (className) {
		inputClasses.push(className);
	}
	const inputClass = inputClasses.join(' ');

	const descriptionId = description ? `${id}-description` : undefined;
	const isRequired = Boolean(required);

	const handleInvalid = useCallback<FormEventHandler<HTMLInputElement>>(
		(event) => {
			setIsInvalid(true);
			inputOnInvalid?.(event);
		},
		[inputOnInvalid],
	);

	const handleInput = useCallback<FormEventHandler<HTMLInputElement>>(
		(event) => {
			if (isInvalid) {
				setIsInvalid(false);
			}
			inputOnInput?.(event);
		},
		[inputOnInput, isInvalid],
	);

	const handleDateChange = useCallback(
		(newValue: Dayjs | null) => {
			if (!isControlled) {
				setInternalValue(newValue);
			}
			if (isInvalid) {
				setIsInvalid(false);
			}
			onDateChange?.(newValue?.toDate() ?? null);
		},
		[isControlled, isInvalid, onDateChange],
	);

	useEffect(() => {
		const inputElement = innerRef.current;
		if (!inputElement) {
			return;
		}

		const formElement = inputElement.form;
		if (!formElement) {
			return;
		}

		const handleFormSubmit = () => {
			if (!innerRef.current) {
				return;
			}

			setIsInvalid(!innerRef.current.checkValidity());
		};

		formElement.addEventListener('submit', handleFormSubmit, true);

		return () => {
			formElement.removeEventListener('submit', handleFormSubmit, true);
		};
	}, [innerRef, required]);

	const getDialogContent = (): Element | null => {
		if (typeof window === 'undefined') {
			return null;
		}
		return document.querySelector('.dialog-content');
	};

	return (
		<div className={fieldClass}>
			<div className="app-textfield-label-wrapper">
				<label className="app-textfield-label" htmlFor={id}>
					<span className="app-textfield-label-content">
						<span className="app-textfield-label-text">
							{label}
							{isRequired ? (
								<span aria-hidden="true" className="app-textfield-required-indicator">
									*
								</span>
							) : null}
						</span>
						{labelIcon ? (
							<span className="app-textfield-label-icon">
								{labelIcon}
							</span>
						) : null}
					</span>
				</label>
				{labelSuffix ? (
					<span className="app-textfield-label-suffix">{labelSuffix}</span>
				) : null}
			</div>

			<LocalizationProvider
				dateAdapter={AdapterDayjs}
				adapterLocale={adapterLocale}
				localeText={localeText}
			>
				<DesktopDatePicker
					value={pickerValue}
					onChange={handleDateChange}
					format={DATE_DISPLAY_FORMAT}
					minDate={minDateValue}
					maxDate={maxDateValue}
					slotProps={{
						popper: {
							container: getDialogContent,
							style: { pointerEvents: 'auto' },
						},
						textField: {
							variant: 'outlined',
							fullWidth: true,
							error: error || isInvalid,
							placeholder,
							required,
							disabled,
							inputRef: handleRef,
							inputProps: {
								id,
								className: inputClass,
								'aria-describedby': descriptionId,
								onInvalid: handleInvalid,
								onInput: handleInput,
								onKeyDown,
								'aria-invalid': error || isInvalid ? 'true' : undefined,
								inputMode,
								form,
								name,
								autoComplete,
							},
						},
					}}
				/>
			</LocalizationProvider>
			{description ? (
				<p id={descriptionId} className="app-textfield-description">
					{description}
				</p>
			) : null}
		</div>
	);
}

function TextfieldComponent(props: TextfieldProps, ref: ForwardedRef<HTMLInputElement>) {
	if (props.variant === 'date-picker') {
		return <DatePickerTextfield {...props} forwardedRef={ref} />;
	}

	return <DefaultTextfield {...props} forwardedRef={ref} />;
}

const Textfield = forwardRef<HTMLInputElement, TextfieldProps>(TextfieldComponent);

Textfield.displayName = 'Textfield';

export default Textfield;
