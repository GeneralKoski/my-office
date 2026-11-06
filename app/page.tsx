import TopBar from '@/components/office/TopBar';
import Stage from '@/components/office/Stage';
import SessionDrawer from '@/components/office/SessionDrawer';
import ArchivePage from '@/components/office/ArchivePage';
import FoldersPage from '@/components/office/FoldersPage';
import PhoneModal from '@/components/office/PhoneModal';
import Toast from '@/components/office/Toast';
import OfficeBoot from '@/components/OfficeBoot';

// Rendered on every request (the components read the office's language from the request headers): the server in
// front of Next decides who may see it. The static demo build renders it once instead.
export default function OfficePage() {
  return (
    <div id="app">
      <TopBar />
      <Stage />
      <SessionDrawer />
      <ArchivePage />
      <FoldersPage />
      <PhoneModal />
      <Toast />
      <OfficeBoot />
    </div>
  );
}
