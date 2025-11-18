export type { IconBaseProps } from 'react-icons';

export {
  FaUserAlt as UserIcon,
  FaRegStar as StarIcon,
  FaPen as PenIcon,
  FaQuestionCircle as QuestionIcon,
} from 'react-icons/fa';

export {
  MdOutlineChecklistRtl as ChecklistIcon,
  MdOutlineComment as CommentIcon,
  MdErrorOutline as AlertCircleIcon,
} from 'react-icons/md';

export {
  IoSchoolOutline as EducationIcon,
  IoSettingsOutline as SettingsIcon,
  IoArrowBack as ArrowLeftIcon,
  IoCheckmarkCircleSharp as CheckIcon,
  IoFlagOutline  as FlagIcon
} from 'react-icons/io5';

export { 
  IoMdClose as CloseIcon,
  IoMdCalendar as CalendarIcon
} from "react-icons/io";

export { 
  AiOutlineLogout as LogoutIcon,
  AiFillExclamationCircle as ExclamationCircleIcon,
  AiOutlineExclamationCircle as ExclamationIcon
} from "react-icons/ai";

export {
  PiHeadCircuit as HeadCircuitIcon,
} from 'react-icons/pi';

export { 
  GiHamburgerMenu as MobileMenu 
} from "react-icons/gi";

export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48
} as const;

export type IconSize = keyof typeof IconSizes | number;

export const getIconSize = (size: IconSize): number => {
  if (typeof size === 'number') return size;
  return IconSizes[size];
};

export const defaultIconProps = {
  size: IconSizes.md,
  'aria-hidden': true,
} as const;