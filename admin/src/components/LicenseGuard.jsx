import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Flex,
  Button,
  TextInput,
  Loader,
} from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { Check, Key, Cross } from '@strapi/icons';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(4, 28, 47, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 20px;
`;

const ModalContent = styled(Box)`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: ${slideUp} 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
`;

const GradientHeader = styled(Box)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px 40px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  }
`;

const IconWrapper = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);

  svg {
    width: 36px;
    height: 36px;
    color: white;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  text-decoration: underline;
  transition: color 0.2s;
  
  &:hover {
    color: #764ba2;
  }
`;

const LicenseGuard = ({ children }) => {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const navigate = useNavigate();

  const [isChecking, setIsChecking] = useState(true);
  const [needsLicense, setNeedsLicense] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [useExistingKey, setUseExistingKey] = useState(false);
  const [existingLicenseKey, setExistingLicenseKey] = useState('');
  const [existingEmail, setExistingEmail] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    setIsChecking(true);
    try {
      const response = await get('/magic-link/license/status');
      
      if (response.data.valid) {
        setNeedsLicense(false);
      } else {
        setNeedsLicense(true);
      }
    } catch (error) {
      console.error('Error checking license:', error);
      setNeedsLicense(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateLicense = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toggleNotification({
        type: 'warning',
        message: 'Please fill in all fields',
        title: 'Validation Error',
      });
      return;
    }

    setIsCreating(true);
    
    try {
      console.log('Creating license with data:', formData);
      const response = await post('/magic-link/license/create', formData);
      console.log('License creation response:', response);
      
      if (response.data && response.data.success) {
        toggleNotification({
          type: 'success',
          message: `License created successfully! Reloading...`,
          title: '✅ License Activated',
        });
        
        // Set state first
        setNeedsLicense(false);
        
        // Reload page immediately to initialize plugin properly
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error('Failed to create license');
      }
    } catch (error) {
      console.error('Error creating license:', error);
      toggleNotification({
        type: 'danger',
        message: error?.response?.data?.error?.message || 'Failed to create license. Please try again.',
        title: 'Error',
      });
      setIsCreating(false);
    }
  };

  const handleValidateExistingKey = async (e) => {
    e.preventDefault();
    
    if (!existingLicenseKey.trim() || !existingEmail.trim()) {
      toggleNotification({
        type: 'warning',
        message: 'Please enter both license key and email address',
        title: 'Validation Error',
      });
      return;
    }

    setIsCreating(true);
    
    try {
      console.log('Validating existing license key...');
      // Store the license key with email validation
      const pluginStore = await post('/magic-link/license/store-key', {
        licenseKey: existingLicenseKey.trim(),
        email: existingEmail.trim(),
      });

      if (pluginStore.data && pluginStore.data.success) {
        toggleNotification({
          type: 'success',
          message: 'License key validated successfully! Reloading...',
          title: '✅ License Activated',
        });
        
        setNeedsLicense(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error('Invalid license key or email');
      }
    } catch (error) {
      console.error('Error validating license key:', error);
      toggleNotification({
        type: 'danger',
        message: error?.response?.data?.error?.message || 'Invalid license key or email address. Please check and try again.',
        title: 'Validation Error',
      });
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    navigate('/content-manager');
  };

  // Show loading state
  if (isChecking) {
    return (
      <Box padding={8} style={{ textAlign: 'center' }}>
        <Loader>Checking license...</Loader>
      </Box>
    );
  }

  // Show license creation modal
  if (needsLicense) {
    return (
      <ModalOverlay>
        <ModalContent>
          {/* Header */}
          <GradientHeader>
            <CloseButton onClick={handleClose} type="button">
              <Cross />
            </CloseButton>
            <IconWrapper>
              <Key />
            </IconWrapper>
            <Box style={{ textAlign: 'center', position: 'relative' }}>
              <Typography
                variant="alpha"
                style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                🔐 Activate Magic Link Plugin
              </Typography>
              <Typography
                variant="epsilon"
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  display: 'block',
                }}
              >
                {useExistingKey ? 'Enter your existing license key' : 'Create a license to start using the plugin'}
              </Typography>
            </Box>
          </GradientHeader>

          {/* Form */}
          <Box
            as="form"
            onSubmit={useExistingKey ? handleValidateExistingKey : handleCreateLicense}
            padding={6}
            paddingLeft={8}
            paddingRight={8}
          >
            <Flex direction="column" gap={5} style={{ width: '100%' }}>
              {/* Toggle Button */}
              <Box style={{ textAlign: 'center', width: '100%' }}>
                <ToggleButton 
                  type="button"
                  onClick={() => setUseExistingKey(!useExistingKey)}
                  disabled={isCreating}
                >
                  {useExistingKey ? '← Create new license instead' : 'Already have a license key? →'}
                </ToggleButton>
              </Box>

              {/* Info Box */}
              <Box
                background="primary100"
                padding={4}
                style={{
                  borderRadius: '8px',
                  border: '2px solid #BAE6FD',
                  width: '100%',
                }}
              >
                <Typography variant="omega" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  {useExistingKey 
                    ? '🔑 Enter your email address and license key below to activate the plugin. The email must match the one used when the license was created.'
                    : '💡 A license will be created automatically for this server. Enter your details below to activate the plugin.'
                  }
                </Typography>
              </Box>

              {/* Conditional Form Fields */}
              {useExistingKey ? (
                // Existing License Key Input
                <>
                  <Box style={{ width: '100%' }}>
                    <Typography
                      variant="pi"
                      fontWeight="bold"
                      style={{ marginBottom: '8px', display: 'block' }}
                    >
                      Email Address *
                    </Typography>
                    <TextInput
                      placeholder="admin@example.com"
                      type="email"
                      value={existingEmail}
                      onChange={(e) => setExistingEmail(e.target.value)}
                      required
                      disabled={isCreating}
                      style={{ width: '100%' }}
                    />
                    <Typography variant="omega" textColor="neutral600" style={{ fontSize: '11px', marginTop: '4px' }}>
                      Enter the email address associated with this license
                    </Typography>
                  </Box>

                  <Box style={{ width: '100%' }}>
                    <Typography
                      variant="pi"
                      fontWeight="bold"
                      style={{ marginBottom: '8px', display: 'block' }}
                    >
                      License Key *
                    </Typography>
                    <TextInput
                      placeholder="67C5-40D2-7695-718C"
                      value={existingLicenseKey}
                      onChange={(e) => setExistingLicenseKey(e.target.value)}
                      required
                      disabled={isCreating}
                      style={{ width: '100%', fontFamily: 'monospace' }}
                    />
                    <Typography variant="omega" textColor="neutral600" style={{ fontSize: '11px', marginTop: '4px' }}>
                      Enter the license key in the format: XXXX-XXXX-XXXX-XXXX
                    </Typography>
                  </Box>
                </>
              ) : (
                // Create New License Fields
                <>

              {/* Email */}
              <Box style={{ width: '100%' }}>
                <Typography
                  variant="pi"
                  fontWeight="bold"
                  style={{ marginBottom: '8px', display: 'block' }}
                >
                  Email Address *
                </Typography>
                <TextInput
                  placeholder="admin@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isCreating}
                  style={{ width: '100%' }}
                />
              </Box>

              {/* First Name */}
              <Box style={{ width: '100%' }}>
                <Typography
                  variant="pi"
                  fontWeight="bold"
                  style={{ marginBottom: '8px', display: 'block' }}
                >
                  First Name *
                </Typography>
                <TextInput
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isCreating}
                  style={{ width: '100%' }}
                />
              </Box>

              {/* Last Name */}
              <Box style={{ width: '100%' }}>
                <Typography
                  variant="pi"
                  fontWeight="bold"
                  style={{ marginBottom: '8px', display: 'block' }}
                >
                  Last Name *
                </Typography>
                <TextInput
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isCreating}
                  style={{ width: '100%' }}
                />
              </Box>

                </>
              )}

              {/* Buttons */}
              <Flex gap={3} justifyContent="center" style={{ marginTop: '16px' }}>
                {useExistingKey ? (
                  // Validate Button
                  <Button
                    type="submit"
                    size="L"
                    startIcon={<Check />}
                    loading={isCreating}
                    disabled={isCreating || !existingLicenseKey.trim() || !existingEmail.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    Validate License
                  </Button>
                ) : (
                  // Create License Button
                  <Button
                    type="submit"
                    size="L"
                    startIcon={<Check />}
                    loading={isCreating}
                    disabled={isCreating || !formData.email || !formData.firstName || !formData.lastName}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    Create License
                  </Button>
                )}
              </Flex>
            </Flex>
          </Box>
        </ModalContent>
      </ModalOverlay>
    );
  }

  // License is valid - show children
  return <>{children}</>;
};

export default LicenseGuard;
