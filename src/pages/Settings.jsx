import { useEffect } from 'react';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import PauseControl from '../ui/PauseControl';

function Settings() {
  useEffect(() => {
    document.title = 'Settings - DoArt';
    return () => {
      document.title = 'DoArt';
    };
  }, []);
  return (
    <Row>
      <Heading as="h1">Settings</Heading>
      <PauseControl />
    </Row>
  );
}

export default Settings;
