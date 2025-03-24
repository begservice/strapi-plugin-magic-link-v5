import React, { useState, useEffect, useCallback } from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Flex,
  TextInput,
  Textarea,
  Typography,
  Grid,
  Switch,
  NumberInput,
  Divider,
  Radio,
  Checkbox,
  Accordion,
  Field,
  SingleSelect,
  SingleSelectOption
} from '@strapi/design-system';
import { Check, Code, Trash } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import getTrad from '../../utils/getTrad';

// Debug-Code entfernen
// console.log('Box type:', typeof Box);
// console.log('Button type:', typeof Button);
// ...

const originalConsoleError = console.error;

// Unterdrücke bestimmte Fehler im Zusammenhang mit Übersetzungen
console.error = function() {
  // Konvertiere Argumente in einen String
  const args = Array.from(arguments).map(arg => String(arg));
  const errorString = args.join(' ');
  
  // Wenn der Fehler eine MISSING_TRANSLATION-Meldung ist, ignoriere ihn
  if (errorString.includes('MISSING_TRANSLATION')) {
    // Optional: Logge, dass ein Übersetzungsfehler unterdrückt wurde
    // console.warn('Unterdrückt: ' + errorString);
    return;
  }
  
  // Ansonsten rufe den ursprünglichen console.error auf
  return originalConsoleError.apply(console, arguments);
};

const Settings = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, put, post } = useFetchClient();
  const [isLoading, setIsLoading] = useState(false);
  
  // Trenne den API-Zustand vom Formular-Zustand
  const [settingsFromAPI, setSettingsFromAPI] = useState({});
  
  // Lokaler unabhängiger Formularstatus
  const [localForm, setLocalForm] = useState({
    enabled: true,
    createUserIfNotExists: true,
    expire_period: 3600,
    confirmationUrl: '',
    from_name: '',
    from_email: '',
    response_email: '',
    token_length: 20,
    stays_valid: false,
    object: '',
    message_html: '',
    message_text: '',
    // Additional settings from passwordless-plugin
    max_login_attempts: 3,
    login_path: '/strapi-plugin-magic-link-v5/login',
    user_creation_strategy: 'email',
    verify_email: false,
    welcome_email: false,
    use_jwt_token: true,
    jwt_token_expires_in: '30d',
    callback_url: '',
    allow_magic_links_on_public_registration: false,
    roles: [],
    // New security setting
    store_login_info: true,
    // Email Designer Integration
    use_email_designer: false,
    email_designer_template_id: ''
  });

  // Check if Email Designer is installed
  const [emailDesignerInstalled, setEmailDesignerInstalled] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);

  // Referenz für die letzte Scroll-Position
  const lastScrollPosition = React.useRef(0);
  
  // Funktion zum Speichern der Scroll-Position
  const saveScrollPosition = useCallback(() => {
    lastScrollPosition.current = window.scrollY;
  }, []);
  
  // Stelle die Scroll-Position wieder her
  const restoreScrollPosition = useCallback(() => {
    window.scrollTo(0, lastScrollPosition.current);
  }, []);

  // Funktion zum Laden der Einstellungen
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    console.log('Initiating API call to fetch Magic Link settings');
    
    try {
      const res = await get('/strapi-plugin-magic-link-v5/settings');
      console.log('Magic Link API response:', res);
      
      // Check if data property exists in the response
      const settingsData = res.data.settings || res.data.data || res.data;
      
      // Entferne verschachtelte settings-Objekte, falls vorhanden
      const cleanSettings = { ...settingsData };
      if (cleanSettings.settings) {
        delete cleanSettings.settings;
      }
      
      // Standardisiere Boolean-Werte
      const booleanFields = [
        'enabled', 'createUserIfNotExists', 'stays_valid', 'verify_email', 
        'welcome_email', 'use_jwt_token', 'allow_magic_links_on_public_registration',
        'store_login_info', 'use_email_designer'
      ];
      
      booleanFields.forEach(field => {
        if (field in cleanSettings) {
          // Bei JSON-Serialisierung kann es vorkommen, dass Booleans zu Strings werden
          if (typeof cleanSettings[field] === 'string') {
            cleanSettings[field] = cleanSettings[field] === 'true';
          }
          // Bei bestimmten Strapi-Designs bekommen wir ein komplexes Objekt
          else if (typeof cleanSettings[field] === 'object' && cleanSettings[field]?.type === 'boolean') {
            cleanSettings[field] = !!cleanSettings[field].value;
          }
          // Stelle sicher, dass wir true/false als boolean haben
          else {
            cleanSettings[field] = !!cleanSettings[field];
          }
        }
      });
      
      // Stelle sicher, dass store_login_info definiert ist
      if (cleanSettings.store_login_info === undefined) {
        cleanSettings.store_login_info = true;
      }
      
      // Setze den API-Zustand
      setSettingsFromAPI(cleanSettings);
      
      // Setze den lokalen Formularstatus
      setLocalForm(cleanSettings);
      
      // Setze die Email Designer Installation Information
      if (res.data.emailDesignerInstalled !== undefined) {
        setEmailDesignerInstalled(res.data.emailDesignerInstalled);
      }
    } catch (error) {
      console.error('Error fetching Magic Link settings:', error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Laden der Magic Link-Einstellungen'
      });
    } finally {
      setIsLoading(false);
    }
  }, [get, toggleNotification]);

  // Fetch email templates if email designer is installed
  const fetchEmailTemplates = useCallback(async () => {
    if (emailDesignerInstalled) {
      try {
        const response = await get('/email-designer-5/templates');
        if (response && response.data) {
          setEmailTemplates(response.data);
        }
      } catch (error) {
        console.error('Error fetching email templates:', error);
        toggleNotification({
          type: 'warning',
          message: 'Fehler beim Laden der E-Mail-Templates'
        });
      }
    }
  }, [emailDesignerInstalled, get, toggleNotification]);

  useEffect(() => {
    if (emailDesignerInstalled) {
      fetchEmailTemplates();
    }
  }, [emailDesignerInstalled, fetchEmailTemplates]);

  // Load settings from the API
  useEffect(() => {
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Einfache Change-Handler für den lokalen Formularstatus
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleToggleChange = useCallback((name) => {
    setLocalForm(prev => {
      // Der aktuelle Wert kann entweder ein einfacher Boolean oder ein Objekt sein
      const currentValue = typeof prev[name] === 'object' && prev[name]?.type === 'boolean' 
        ? prev[name].value 
        : prev[name] === true;
      
      return { ...prev, [name]: !currentValue };
    });
  }, []);

  const handleNumberChange = useCallback((name, value) => {
    setLocalForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleRadioChange = useCallback((name, value) => {
    setLocalForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Form submission handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    saveScrollPosition();
    setIsLoading(true);
    
    try {
      // Einstellungen für die Übermittlung vorbereiten
      const settingsToSubmit = { ...localForm };
      
      // Entferne verschachtelte settings-Objekte, falls vorhanden
      if (settingsToSubmit.settings) {
        delete settingsToSubmit.settings;
      }

      // Alle Boolean-Werte standardisieren
      Object.keys(settingsToSubmit).forEach(key => {
        // Wenn es ein Objekt mit Boolean-Typ ist, extrahiere den Wert
        if (typeof settingsToSubmit[key] === 'object' && settingsToSubmit[key]?.type === 'boolean') {
          settingsToSubmit[key] = !!settingsToSubmit[key].value;
        } 
        
        // Entferne undefined-Werte
        if (settingsToSubmit[key] === undefined) {
          delete settingsToSubmit[key];
        }
      });
      
      // Sende die Änderungen an die API
      const response = await put('/strapi-plugin-magic-link-v5/settings', settingsToSubmit);
      console.log('Settings saved response:', response);
      
      // Aktualisiere den API-Zustand
      setSettingsFromAPI(settingsToSubmit);
      
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: 'notification.success.saved', defaultMessage: 'Settings saved' }),
      });
    } catch (err) {
      console.error(err);
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: 'notification.error', defaultMessage: 'An error occurred' }),
      });
    } finally {
      setIsLoading(false);
      // Stelle die Scroll-Position wieder her
      restoreScrollPosition();
    }
  }, [localForm, put, toggleNotification, formatMessage, saveScrollPosition, restoreScrollPosition]);

  // Helper-Funktion zur sichereren Verwendung von Übersetzungen
  const safeTranslate = (key, defaultMessage) => {
    // Direkter Zugriff ohne Präfix für settings.-Schlüssel, da diese in der JSON im Hauptobjekt liegen
    if (key.startsWith('settings.') || key.startsWith('Settings.')) {
      try {
        return formatMessage({ 
          id: key, 
          defaultMessage
        }, {}, {
          ignoreTag: true
        });
      } catch (error) {
        // Fallback zum Default
        return defaultMessage;
      }
    }
    
    // Für andere Schlüssel nutzen wir getTrad
    try {
      return formatMessage({ 
        id: getTrad(key), 
        defaultMessage
      }, {}, {
        ignoreTag: true
      });
    } catch (error) {
      // Fallback auf direkten Schlüssel ohne getTrad
      try {
        return formatMessage({ 
          id: key, 
          defaultMessage 
        }, {}, {
          ignoreTag: true
        });
      } catch (innerError) {
        // Letzte Chance - direkt das Default verwenden
        console.warn(`Translation error for key: ${key}`, error);
        return defaultMessage;
      }
    }
  };

  // Section header component
  const SectionHeader = ({ title, description }) => (
    <Box paddingBottom={4}>
      <Typography variant="delta" as="h2">
        {title}
      </Typography>
      {description && (
        <Typography variant="pi" textColor="neutral600">
          {description}
        </Typography>
      )}
    </Box>
  );

  // Form section component (contains title and divider)
  const FormSection = ({ title, description, children }) => {
    // Extrahiere den ersten Teil des Titels für den Schlüssel (z.B. "General" aus "General Settings")
    const baseName = title.split(' ')[0].toLowerCase();
    
    // Versuche verschiedene mögliche Übersetzungspfade
    const settingsKey = `Settings.${baseName}.title`;
    const settingsNestedKey = `settings.${baseName}.title`;
    
    // Verwende erst den direkten Schlüssel, dann den nested und als Fallback den Titel
    const displayTitle = safeTranslate(settingsKey, safeTranslate(settingsNestedKey, title));
    
    // Ähnliches Vorgehen für die Beschreibung
    const descSettingsKey = `Settings.${baseName}.description`;
    const descNestedKey = `settings.${baseName}.description`;
    
    const displayDescription = description ? 
      safeTranslate(descSettingsKey, safeTranslate(descNestedKey, description)) : 
      null;
    
    return (
      <Box paddingBottom={6}>
        <SectionHeader title={displayTitle} description={displayDescription} />
        <Divider />
        <Box paddingTop={4} paddingBottom={4}>
          {children}
        </Box>
      </Box>
    );
  };

  // Field row with standardized layout
  const FieldRow = ({ children }) => (
    <Box paddingBottom={4} style={{ width: '100%' }}>
      {children}
    </Box>
  );

  // Styled TextInput component
  const StyledTextInput = ({ name, label, hint, value, onChange, ...props }) => {
    // Konvertiere snake_case zu camelCase wenn nötig
    const formattedName = name.includes('_') 
      ? name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      : name;
    
    // Bestimme den Bereich basierend auf Props oder leite ihn aus dem Namen ab
    const section = props.section || 
      (name.includes('jwt') ? 'authentication' : 
       name.includes('email') || name.includes('from') || name.includes('response') ? 'email' : 'general');
    
    // Versuche verschiedene mögliche Übersetzungspfade
    const settingsKey = `Settings.${name}.label`;
    const settingsNestedKey = `settings.${section}.${formattedName}.label`;
    
    // Verwende erst den Settings-Schlüssel, dann nested und als Fallback das Label
    const displayLabel = safeTranslate(settingsKey, safeTranslate(settingsNestedKey, label));
    
    // Ähnliches Vorgehen für den Hilfetext
    const hintSettingsKey = `Settings.${name}.description`;
    const hintNestedKey = `settings.${section}.${formattedName}.hint`;
    
    const displayHint = hint ? safeTranslate(hintSettingsKey, safeTranslate(hintNestedKey, hint)) : null;
    
    // Lokaler State für den Input-Wert
    const [localValue, setLocalValue] = React.useState(value);
    
    // Input-Referenz
    const inputRef = React.useRef(null);
    
    // Wenn sich der Wert von außen ändert, aktualisiere den lokalen Wert
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);
    
    // Debounce-Funktion, um zu häufige Updates zu vermeiden
    const debounceTimeout = React.useRef(null);
    
    // Verzögertes Update der übergeordneten Komponente
    const handleLocalChange = (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      
      // Lösche vorheriges Timeout, wenn es existiert
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Setze neues Timeout für verzögertes Update
      debounceTimeout.current = setTimeout(() => {
        saveScrollPosition();
        onChange({ target: { name, value: newValue } });
      }, 300);
    };
    
    return (
      <>
        <TextInput
          ref={inputRef}
          name={name}
          label={displayLabel}
          value={localValue}
          onChange={handleLocalChange}
          style={{ width: '100%' }}
          {...props}
        />
        {displayHint && (
          <Box paddingTop={1} paddingBottom={2}>
            <Typography variant="pi" textColor="neutral600" style={{ display: 'block', textAlign: 'left' }}>
              {displayHint}
            </Typography>
          </Box>
        )}
      </>
    );
  };

  // Styled NumberInput component
  const StyledNumberInput = ({ name, label, hint, value, onChange, ...props }) => {
    // Konvertiere snake_case zu camelCase wenn nötig
    const formattedName = name.includes('_') 
      ? name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      : name;
    
    // Bestimme den Bereich basierend auf Props oder leite ihn aus dem Namen ab
    const section = props.section || 
      (name.includes('login_attempts') ? 'authentication' : 'general');
    
    // Versuche verschiedene mögliche Übersetzungspfade
    const settingsKey = `Settings.${name}.label`;
    const settingsNestedKey = `settings.${section}.${formattedName}.label`;
    
    // Verwende erst den Settings-Schlüssel, dann nested und als Fallback das Label
    const displayLabel = safeTranslate(settingsKey, safeTranslate(settingsNestedKey, label));
    
    // Ähnliches Vorgehen für den Hilfetext
    const hintSettingsKey = `Settings.${name}.description`;
    const hintNestedKey = `settings.${section}.${formattedName}.hint`;
    
    const displayHint = hint ? safeTranslate(hintSettingsKey, safeTranslate(hintNestedKey, hint)) : null;
    
    // Lokaler State für den Input-Wert
    const [localValue, setLocalValue] = React.useState(value);
    
    // Input-Referenz
    const inputRef = React.useRef(null);
    
    // Wenn sich der Wert von außen ändert, aktualisiere den lokalen Wert
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);
    
    // Debounce-Funktion, um zu häufige Updates zu vermeiden
    const debounceTimeout = React.useRef(null);
    
    // Verzögertes Update der übergeordneten Komponente
    const handleLocalChange = (val) => {
      setLocalValue(val);
      
      // Lösche vorheriges Timeout, wenn es existiert
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Setze neues Timeout für verzögertes Update
      debounceTimeout.current = setTimeout(() => {
        saveScrollPosition();
        onChange(val);
      }, 300);
    };
    
    return (
      <>
        <NumberInput
          ref={inputRef}
          name={name}
          label={displayLabel}
          value={localValue}
          onChange={handleLocalChange}
          style={{ width: '100%' }}
          {...props}
        />
        {displayHint && (
          <Box paddingTop={1} paddingBottom={2}>
            <Typography variant="pi" textColor="neutral600" style={{ display: 'block', textAlign: 'left' }}>
              {displayHint}
            </Typography>
          </Box>
        )}
      </>
    );
  };

  // Styled Textarea component with proper Field layout
  const EnhancedTextarea = ({ name, label, hint, value, onChange }) => {
    // Konvertiere snake_case zu camelCase wenn nötig
    const formattedName = name.includes('_') 
      ? name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      : name;
    
    // Bestimme den Typ basierend auf dem Namen
    const isHtml = name.includes('html');
    const type = isHtml ? 'htmlTemplate' : 'textTemplate';
    
    // Versuche verschiedene mögliche Übersetzungspfade
    const settingsKey = `Settings.${name}.label`;
    const settingsNestedKey = `settings.email.${type}.label`;
    
    // Verwende erst den Settings-Schlüssel, dann nested und als Fallback das Label
    const displayLabel = safeTranslate(settingsKey, safeTranslate(settingsNestedKey, label));
    
    // Ähnliches Vorgehen für den Hilfetext
    const hintSettingsKey = `Settings.${name}.description`;
    const hintNestedKey = `settings.email.${type}.hint`;
    
    const displayHint = hint ? safeTranslate(hintSettingsKey, safeTranslate(hintNestedKey, hint)) : null;
    
    // Placeholder für die Textarea
    const placeholder = safeTranslate('settings.email.template.placeholder', 
      `Example: <a href="<%= URL %>?code=<%= CODE %>">Click here to login</a>`);
    
    // Textarea Ref für direkte DOM-Manipulation
    const textareaRef = React.useRef(null);
    
    // Lokaler Zustand für die Textarea, um Live-Editing-Probleme zu vermeiden
    const [localValue, setLocalValue] = React.useState(value);
    
    // Wenn sich der Wert von außen ändert, aktualisiere den lokalen Wert
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);
    
    // Debounce-Funktion, um zu häufige Updates zu vermeiden
    const debounceTimeout = React.useRef(null);
    
    // Verzögertes Update der übergeordneten Komponente
    const handleLocalChange = (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      
      // Lösche vorheriges Timeout, wenn es existiert
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Setze neues Timeout für verzögertes Update
      debounceTimeout.current = setTimeout(() => {
        saveScrollPosition();
        onChange({ target: { name, value: newValue } });
      }, 500);
    };
    
    return (
      <Box background="neutral0" padding={4} hasRadius shadow="filterShadow">
        <Field.Root hint={displayHint}>
          <Field.Label>{displayLabel}</Field.Label>
          <Box
            background="neutral150"
            hasRadius
            style={{
              position: 'relative',
              border: '1px solid #dcdce4',
              overflow: 'hidden',
            }}
          >
            <Textarea
              ref={textareaRef}
              name={name}
              value={localValue} 
              onChange={handleLocalChange}
              style={{ 
                width: '100%', 
                minHeight: "200px",
                maxHeight: "450px",
                height: "auto",
                fontSize: "14px",
                fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
                lineHeight: "1.6",
                padding: "10px 15px",
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                resize: "vertical",
                overflowX: "auto",
                tabSize: "2",
                whiteSpace: "pre",
                wordBreak: "normal",
                overflow: "auto"
              }}
              placeholder={placeholder}
            />
          </Box>
          <Field.Hint />
        </Field.Root>
      </Box>
    );
  };

  // Toggle field
  const ToggleField = ({ name, label, value, required = false, hint }) => {
    // Bestimme den Bereich basierend auf dem Namen
    const section = 
      name.includes('jwt') || name.includes('verify') || name.includes('welcome') || name.includes('allow') || name.includes('store_login') ? 'authentication' : 
      name.includes('email') ? 'email' : 'general';
    
    // Versuche verschiedene mögliche Übersetzungspfade
    const settingsKey = `Settings.${name}.label`;
    const settingsNestedKey = `settings.${section}.${name}.label`;
    
    // Verwende erst den Settings-Schlüssel, dann nested und als Fallback das Label
    const displayLabel = safeTranslate(settingsKey, safeTranslate(settingsNestedKey, label));
    
    // Ähnliches Vorgehen für den Hilfetext
    const hintSettingsKey = `Settings.${name}.description`;
    const hintNestedKey = `settings.${section}.${name}.hint`;
    
    const displayHint = hint ? safeTranslate(hintSettingsKey, safeTranslate(hintNestedKey, hint)) : null;
    
    // Berechne, ob der Toggle aktiviert ist
    const isChecked = value === true;
    
    return (
      <Box style={{ width: '100%', height: '100%' }}>
        <Flex direction="column" gap={2} style={{ height: '100%' }}>
          <Flex style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box style={{ flex: 1, maxWidth: '70%' }}>
              <Typography variant="pi" fontWeight="bold">{displayLabel}{required && ' *'}</Typography>
            </Box>
            <Box style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
              <Switch
                checked={isChecked}
                onCheckedChange={() => handleToggleChange(name)}
                size="M"
              />
            </Box>
          </Flex>
          {displayHint && (
            <Typography variant="pi" textColor="neutral600" style={{ textAlign: 'left' }}>
              {displayHint}
            </Typography>
          )}
        </Flex>
      </Box>
    );
  };

  const handleResetData = () => {
    confirm({
      title: formatMessage({ id: getTrad('settings.dangerZone.resetData.confirmTitle'), defaultMessage: 'Reset all plugin data?' }),
      message: formatMessage({ id: getTrad('settings.dangerZone.resetData.confirmMessage'), defaultMessage: 'This will delete all magic link tokens and settings. This action cannot be undone.' }),
      onConfirm: async () => {
        try {
          await post('/strapi-plugin-magic-link-v5/reset-data');
          
          // ... existing code ...
        } catch (error) {
          console.error('Fehler beim Zurücksetzen der Daten:', error);
          toggleNotification({
            type: 'danger',
            message: 'Fehler beim Zurücksetzen der Daten: ' + (error.response?.data?.message || error.message)
          });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <Box 
        background="neutral100" 
        padding={4} 
        shadow="tableShadow" 
        position="relative" 
        zIndex={2}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Flex direction="column" gap={2}>
            <Typography variant="alpha">
              {safeTranslate('settings.header.title', 'Magic Link Settings')}
            </Typography>
            <Typography variant="epsilon">
              {safeTranslate('settings.header.description', 'Configure secure passwordless authentication for your users')}
            </Typography>
          </Flex>
          <Button
            type="submit"
            loading={isLoading}
            startIcon={<Check />}
            disabled={isLoading}
          >
            {safeTranslate('global.save', 'Save')}
          </Button>
        </Flex>
      </Box>
      
      {/* Content */}
      <Box paddingTop={4} paddingLeft={4} paddingRight={4}>
        <Flex justifyContent="center">
          <Box background="neutral0" padding={8} shadow="filterShadow" hasRadius style={{ maxWidth: '1200px', width: '100%' }}>
            {/* General Settings */}
            <FormSection 
              title={safeTranslate('settings.general.title', 'General Settings')}
              description={safeTranslate('settings.general.description', 'Basic configuration for the Magic Link functionality')}
            >
              <Box background="neutral100" padding={4} hasRadius marginBottom={6}>
                <Flex direction="column" gap={4}>
                  <Typography variant="sigma" textAlign="center" fontWeight="bold">
                    {safeTranslate('settings.general.featureToggles', 'FEATURE TOGGLES')}
                  </Typography>
                  
                  <Grid.Root gap={8} style={{ alignItems: 'stretch' }}>
                    <Grid.Item col={4} xs={12} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="enabled"
                          label={safeTranslate('settings.general.enableMagicLink', 'Enable Magic Link')}
                          value={localForm.enabled}
                          required
                          hint={safeTranslate('settings.general.enableMagicLink.hint', 'Enables a secure and seamless emailed link authentication.')}
                        />
                      </Box>
                    </Grid.Item>
                    
                    <Grid.Item col={4} xs={12} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="createUserIfNotExists"
                          label={safeTranslate('settings.general.createNewUsers', 'Create New Users')}
                          value={localForm.createUserIfNotExists}
                          hint={safeTranslate('settings.general.createNewUsers.hint', 'Create new user by email if it doesn\'t exist.')}
                        />
                      </Box>
                    </Grid.Item>
                    
                    <Grid.Item col={4} xs={12} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="stays_valid"
                          label={safeTranslate('settings.general.tokenStaysValid', 'Token Stays Valid After Use')}
                          value={localForm.stays_valid}
                          hint={safeTranslate('settings.general.tokenStaysValid.hint', 'If enabled, the token will remain valid after being used. Less secure but more convenient.')}
                        />
                      </Box>
                    </Grid.Item>
                  </Grid.Root>
                </Flex>
              </Box>
              
              <Grid.Root gap={6}>
                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.general.expirationPeriod', 'Expiration Period')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledNumberInput
                        name="expire_period"
                        label={safeTranslate('settings.general.expirationPeriod.label', 'Expiration period in seconds')}
                        hint={safeTranslate('settings.general.expirationPeriod.hint', 'Zeitraum in Sekunden, nach dem der Magic-Link abläuft und nicht mehr verwendet werden kann. Standardwert: 3600 (1 Stunde)')}
                        value={localForm.expire_period}
                        onChange={(val) => handleNumberChange('expire_period', val)}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.general.tokenLength', 'Token Length')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledNumberInput
                        name="token_length"
                        label={safeTranslate('settings.general.tokenLength.label', 'Token length')}
                        hint={safeTranslate('settings.general.tokenLength.hint', 'Länge des generierten Tokens in Zeichen. Längere Tokens bieten mehr Sicherheit. Empfohlen: 20-40 Zeichen.')}
                        value={localForm.token_length}
                        onChange={(val) => handleNumberChange('token_length', val)}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label">
                      {safeTranslate('settings.general.maxLoginAttempts', 'Maximum Login Attempts')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledNumberInput
                        name="max_login_attempts"
                        label={safeTranslate('settings.general.maxLoginAttempts.label', 'Max login attempts')}
                        hint={safeTranslate('settings.general.maxLoginAttempts.hint', 'Begrenzt die Anzahl fehlgeschlagener Login-Versuche, bevor ein Benutzer blockiert wird. Bei 0 ist diese Funktion deaktiviert.')}
                        value={localForm.max_login_attempts}
                        onChange={(val) => handleNumberChange('max_login_attempts', val)}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={12}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.general.loginPath', 'Login API Path')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="login_path"
                        label={safeTranslate('settings.general.loginPath.label', 'Login API path')}
                        hint={safeTranslate('settings.general.loginPath.hint', 'Der API-Pfad, unter dem der Magic-Link-Login-Endpunkt erreichbar ist. Standardwert ist /magic-link/login und wird mit dem loginToken-Parameter verwendet (z.B. /magic-link/login?loginToken=XXX).')}
                        value={localForm.login_path}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={12}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.general.confirmationUrl', 'Confirmation URL')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="confirmationUrl"
                        label={safeTranslate('settings.general.confirmationUrl.label', 'Confirmation URL')}
                        hint={safeTranslate('settings.general.confirmationUrl.hint', 'Die URL, zu der Benutzer weitergeleitet werden, nachdem sie auf den Magic-Link geklickt haben. Dies ist die Basis-URL, die im Magic-Link verwendet wird.')}
                        value={localForm.confirmationUrl}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={12}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label">
                      {safeTranslate('settings.general.callbackUrl', 'Callback URL')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="callback_url"
                        label={safeTranslate('settings.general.callbackUrl.label', 'Callback URL')}
                        hint={safeTranslate('settings.general.callbackUrl.hint', 'Die URL, zu der Benutzer nach erfolgreicher Authentifizierung weitergeleitet werden. Wenn leer, werden Benutzer zur Startseite weitergeleitet.')}
                        value={localForm.callback_url}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
              </Grid.Root>
            </FormSection>

            {/* Authentication Settings */}
            <FormSection 
              title={safeTranslate('settings.authentication.title', 'Authentication Settings')}
              description={safeTranslate('settings.authentication.description', 'Configure how users are authenticated and created')}
            >
              <Box background="neutral100" padding={4} hasRadius marginBottom={6}>
                <Flex direction="column" gap={4}>
                  <Typography variant="sigma" fontWeight="bold" textAlign="center">
                    {safeTranslate('settings.authentication.options', 'Authentication Options')}
                  </Typography>
                  
                  <Grid.Root gap={4} style={{ alignItems: 'stretch' }}>
                    <Grid.Item col={6} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="verify_email"
                          label={safeTranslate('settings.authentication.verifyEmail', 'Verify Email')}
                          value={localForm.verify_email}
                          hint={safeTranslate('settings.authentication.verifyEmail.hint', 'Verify user email before allowing authentication. Enhances security.')}
                        />
                      </Box>
                    </Grid.Item>
                    
                    <Grid.Item col={6} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="welcome_email"
                          label={safeTranslate('settings.authentication.welcomeEmail', 'Send Welcome Email')}
                          value={localForm.welcome_email}
                          hint={safeTranslate('settings.authentication.welcomeEmail.hint', 'Send a welcome email to new users when they are created.')}
                        />
                      </Box>
                    </Grid.Item>
                    
                    <Grid.Item col={6} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="use_jwt_token"
                          label={safeTranslate('settings.authentication.useJwtToken', 'Use JWT Token')}
                          value={localForm.use_jwt_token}
                          hint={safeTranslate('settings.authentication.useJwtToken.hint', 'Use JWT token for authentication instead of session cookies.')}
                        />
                      </Box>
                    </Grid.Item>
                    
                    <Grid.Item col={6} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="allow_magic_links_on_public_registration"
                          label={safeTranslate('settings.authentication.allowOnPublicRegistration', 'Allow on Public Registration')}
                          value={localForm.allow_magic_links_on_public_registration}
                          hint={safeTranslate('settings.authentication.allowOnPublicRegistration.hint', 'Allow magic links to be used on public registration forms.')}
                        />
                      </Box>
                    </Grid.Item>

                    <Grid.Item col={6} style={{ display: 'flex' }}>
                      <Box style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        width: '100%',
                        height: '100%', 
                        padding: '8px 16px'
                      }}>
                        <ToggleField 
                          name="store_login_info"
                          label={safeTranslate('settings.authentication.storeLoginInfo', 'Store Login Information')}
                          value={localForm.store_login_info}
                          hint={safeTranslate('settings.authentication.storeLoginInfo.hint', 'Store User-Agent and IP address for each login attempt. Enhances security monitoring.')}
                        />
                      </Box>
                    </Grid.Item>
                  </Grid.Root>
                </Flex>
              </Box>
              
              <Grid.Root gap={6}>
                {/* User Creation Strategy */}
                <Grid.Item col={12}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.authentication.userCreationStrategy', 'User Creation Strategy')}
                    </Typography>
                    <Box paddingTop={2} paddingBottom={2}>
                      <SingleSelect
                        name="user_creation_strategy"
                        label={safeTranslate('settings.authentication.userCreationStrategy.label', 'Select how users are created')}
                        placeholder={safeTranslate('settings.authentication.userCreationStrategy.placeholder', 'Select a strategy')}
                        value={localForm.user_creation_strategy}
                        onChange={(value) => handleRadioChange('user_creation_strategy', value)}
                        required
                      >
                        <SingleSelectOption value="email">
                          {safeTranslate('settings.authentication.userCreationStrategy.email', 'Email only - Create user with email only')}
                        </SingleSelectOption>
                        <SingleSelectOption value="emailUsername">
                          {safeTranslate('settings.authentication.userCreationStrategy.emailUsername', 'Email + Username - Create user with email and generate username from it')}
                        </SingleSelectOption>
                        <SingleSelectOption value="manual">
                          {safeTranslate('settings.authentication.userCreationStrategy.manual', 'No automatic creation - Users must be created manually first')}
                        </SingleSelectOption>
                      </SingleSelect>
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label">
                      {safeTranslate('settings.authentication.jwtTokenExpiration', 'JWT Token Expiration')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="jwt_token_expires_in"
                        label={safeTranslate('settings.authentication.jwtTokenExpiration.label', 'JWT token expiration time')}
                        hint={safeTranslate('settings.authentication.jwtTokenExpiration.hint', 'Gültigkeitsdauer des JWT-Tokens nach erfolgreicher Authentifizierung. Beispiele: \'1h\' (1 Stunde), \'7d\' (7 Tage), \'30d\' (30 Tage)')}
                        value={localForm.jwt_token_expires_in}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
              </Grid.Root>
            </FormSection>

            {/* Email Settings */}
            <FormSection 
              title={safeTranslate('settings.email.title', 'Email Settings')}
              description={safeTranslate('settings.email.description', 'Configure email templates and sender information')}
            >
              <Grid.Root gap={6}>
                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.email.senderName', 'Sender Name')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="from_name"
                        label={safeTranslate('settings.email.senderName.label', 'From name')}
                        hint={safeTranslate('settings.email.senderName.hint', 'Name displayed in the from field of the email.')}
                        value={localForm.from_name}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.email.senderEmail', 'Sender Email')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="from_email"
                        label={safeTranslate('settings.email.senderEmail.label', 'From email')}
                        hint={safeTranslate('settings.email.senderEmail.hint', 'Email address used to send the magic link.')}
                        value={localForm.from_email}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>

                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label">
                      {safeTranslate('settings.email.replyToEmail', 'Reply-To Email')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="response_email"
                        label={safeTranslate('settings.email.replyToEmail.label', 'Response email (optional)')}
                        hint={safeTranslate('settings.email.replyToEmail.hint', 'Email address for replies.')}
                        value={localForm.response_email}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>
                
                <Grid.Item col={6}>
                  <FieldRow>
                    <Typography variant="pi" fontWeight="bold" as="label" required>
                      {safeTranslate('settings.email.subject', 'Email Subject')}
                    </Typography>
                    <Box paddingTop={1}>
                      <StyledTextInput
                        name="object"
                        label={safeTranslate('settings.email.subject.label', 'Email subject line')}
                        hint={safeTranslate('settings.email.subject.hint', 'Subject line of the magic link email.')}
                        value={localForm.object}
                        onChange={handleChange}
                      />
                    </Box>
                  </FieldRow>
                </Grid.Item>

                {/* Email Designer Integration */}
                {emailDesignerInstalled && (
                  <>
                    <Grid.Item col={12}>
                      <Divider />
                      <FieldRow>
                        <Typography variant="delta" as="h3">
                          Email Designer 5 Integration
                        </Typography>
                        <Box paddingTop={2}>
                          <Typography variant="pi" textColor="neutral600">
                            Das Email Designer 5 Plugin ist installiert. Sie können Templates aus dem Email Designer für Magic Link Emails verwenden.
                          </Typography>
                        </Box>
                      </FieldRow>
                    </Grid.Item>

                    <Grid.Item col={6}>
                      <FieldRow>
                        <ToggleField
                          name="use_email_designer"
                          label="Email Designer Templates verwenden"
                          hint="Aktivieren Sie diese Option, um Email Designer Templates anstelle der einfachen HTML/Text-Emails zu verwenden."
                          value={localForm.use_email_designer}
                        />
                      </FieldRow>
                    </Grid.Item>
                    
                    {localForm.use_email_designer && (
                      <Grid.Item col={6}>
                        <FieldRow>
                          <Typography variant="pi" fontWeight="bold" as="label" required>
                            Email Template ID
                          </Typography>
                          <Box paddingTop={1}>
                            <StyledTextInput
                              name="email_designer_template_id"
                              label="Email Template ID"
                              hint="Geben Sie die ID des Email Templates ein"
                              value={localForm.email_designer_template_id}
                              onChange={handleChange}
                            />
                          </Box>
                        </FieldRow>
                      </Grid.Item>
                    )}
                  </>
                )}

                <Grid.Item col={12}>
                  <FieldRow>
                    <Typography variant="delta" as="h3" required>
                      {safeTranslate('settings.email.templates', 'Email Templates')}
                    </Typography>
                    <Box paddingTop={4}>
                      <Accordion.Root defaultValue="html-template">
                        <Accordion.Item value="html-template">
                          <Accordion.Header>
                            <Accordion.Trigger 
                              icon={Code} 
                              description={safeTranslate('settings.email.htmlTemplate.description', 'HTML formatted email that will be sent to users')}
                            >
                              {safeTranslate('settings.email.htmlTemplate', 'HTML Email Template')}
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content>
                            <Box 
                              padding={4} 
                              background="neutral100" 
                              hasRadius 
                              marginBottom={4} 
                              marginTop={2}
                              style={{ maxWidth: "100%" }}
                            >
                              <EnhancedTextarea
                                name="message_html"
                                label={safeTranslate('settings.email.htmlTemplate.label', 'HTML message template')}
                                hint={safeTranslate('settings.email.htmlTemplate.hint', 'Use <%= URL %> for base URL and <%= CODE %> for token. You can use HTML formatting to make your email look better.')}
                                value={localForm.message_html}
                                onChange={handleChange}
                              />
                            </Box>
                          </Accordion.Content>
                        </Accordion.Item>
                        
                        <Accordion.Item value="text-template">
                          <Accordion.Header>
                            <Accordion.Trigger 
                              icon={Code} 
                              description={safeTranslate('settings.email.textTemplate.description', 'Plain text alternative for email clients that don\'t support HTML')}
                            >
                              {safeTranslate('settings.email.textTemplate', 'Plain Text Email Template')}
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content>
                            <Box 
                              padding={4} 
                              background="neutral100" 
                              hasRadius 
                              marginBottom={4} 
                              marginTop={2}
                              style={{ maxWidth: "100%" }}
                            >
                              <EnhancedTextarea
                                name="message_text"
                                label={safeTranslate('settings.email.textTemplate.label', 'Text message template')}
                                hint={safeTranslate('settings.email.textTemplate.hint', 'Use <%= URL %> for base URL and <%= CODE %> for token. This version is used for email clients that can\'t display HTML.')}
                                value={localForm.message_text}
                                onChange={handleChange}
                              />
                            </Box>
                          </Accordion.Content>
                        </Accordion.Item>
                      </Accordion.Root>
                    </Box>
                  </FieldRow>
                </Grid.Item>
              </Grid.Root>
            </FormSection>
            
            {/* Reset Section */}
            <Box paddingTop={6} paddingBottom={6}>
              <Divider />
              <Box paddingTop={6}>
                <Typography variant="beta" textColor="danger600">
                  {safeTranslate('settings.reset.title', 'Zurücksetzen & Daten löschen')}
                </Typography>
                <Box paddingTop={2} paddingBottom={4}>
                  <Typography variant="omega" textColor="neutral600">
                    {safeTranslate('settings.reset.description', 'Diese Aktion setzt alle Magic Link Einstellungen auf die Standardwerte zurück und löscht alle gespeicherten Tokens, JWT-Sessions und gebannte IPs. Diese Aktion kann nicht rückgängig gemacht werden!')}
                  </Typography>
                </Box>
                <Button
                  variant="danger"
                  onClick={handleResetData}
                  startIcon={<Trash />}
                  disabled={isLoading}
                >
                  {safeTranslate('settings.reset.button', 'Alle Daten zurücksetzen')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Flex>
      </Box>
    </form>
  );
};

export { Settings };
export default Settings;
