import React from 'react';
import SettingsModern from './SettingsModern';
import { LanguageProvider } from '../../components/LanguageProvider';
import LicenseGuard from '../../components/LicenseGuard';

const SettingsWithLanguage = () => (
  <LicenseGuard>
    <LanguageProvider>
      <SettingsModern />
    </LanguageProvider>
  </LicenseGuard>
);

export default SettingsWithLanguage;
