import BottomNavLayout from '@/layout/user-layout/BottomNavLayout';
import { DEFAULT_BOTTOM_NAVBAR_ITEMS } from '@/components/navbar/bottom-navbar/defaultItems';

export default function UserEmployeeLayout() {
  return <BottomNavLayout items={DEFAULT_BOTTOM_NAVBAR_ITEMS} />;
}

