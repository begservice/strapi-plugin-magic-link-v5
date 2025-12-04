import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  Typography,
  Box,
  Flex,
  Button,
  TextInput,
  Textarea,
  Checkbox,
} from '@strapi/design-system';
import { Sparkle, Cross } from '@strapi/icons';
import getTrad from '../../utils/getTrad';

const CreateTokenModal = ({ isOpen, onClose, onSubmit, formData, setFormData }) => {
  const { formatMessage } = useIntl();
  const [contextText, setContextText] = useState('');
  const [contextError, setContextError] = useState('');
  
  // Reset context when modal opens/closes (MUST be before early return!)
  useEffect(() => {
    if (isOpen && formData.context && Object.keys(formData.context).length > 0) {
      setContextText(JSON.stringify(formData.context, null, 2));
    } else {
      setContextText('');
      setContextError('');
    }
  }, [isOpen, formData.context]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    // Validate JSON if context is provided
    if (contextText.trim()) {
      try {
        const parsedContext = JSON.parse(contextText);
        setFormData({ ...formData, context: parsedContext });
      } catch (err) {
        setContextError(formatMessage({ id: getTrad('tokens.create.context.error') }));
        return;
      }
    }
    
    onSubmit();
  };

  const getLabelStyle = () => ({
    marginBottom: '8px',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  });

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleContextChange = (e) => {
    const value = e.target.value;
    setContextText(value);
    setContextError('');
    
    // Try to parse JSON
    if (value.trim()) {
      try {
        JSON.parse(value);
        setContextError('');
      } catch (err) {
        setContextError(formatMessage({ id: getTrad('tokens.create.context.error') }));
      }
    }
  };
  
  if (!isOpen) return null;

  return (
    <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(4, 28, 47, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <Box
          as="form"
          background="neutral0"
          shadow="filterShadow"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '600px',
            maxHeight: 'calc(100vh - 40px)',
            overflow: 'auto',
            borderRadius: '8px',
          }}
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          {/* Header */}
          <Box
            paddingTop={6}
            paddingLeft={7}
            paddingRight={7}
            paddingBottom={4}
            style={{
              borderBottom: '1px solid #f1f1f1',
            }}
          >
            <Flex justifyContent="space-between" alignItems="flex-start">
              <Flex direction="column" gap={1} style={{ flex: 1, marginRight: '16px' }}>
                <Typography 
                  variant="alpha" 
                  fontWeight="bold"
                  style={{ 
                    fontSize: '20px', 
                    lineHeight: '1.2',
                  }}
                >
                  {formatMessage({ id: getTrad('tokens.create.title') })}
                </Typography>
              </Flex>
              <Button
                onClick={onClose}
                variant="ghost"
                style={{ 
                  padding: '8px',
                  minWidth: 'auto',
                  marginTop: '-4px',
                }}
              >
                <Cross />
              </Button>
            </Flex>
          </Box>

          {/* Body */}
          <Box 
            paddingTop={6}
            paddingLeft={7}
            paddingRight={7}
            paddingBottom={6}
          >
            <Flex direction="column" alignItems="stretch" gap={6}>
              {/* E-Mail Feld */}
              <Box>
                <Typography 
                  variant="sigma" 
                  fontWeight="semiBold"
                  textColor="neutral800"
                  style={getLabelStyle()}
                >
                  {formatMessage({ id: getTrad('tokens.create.email.label') })}
                </Typography>
                <TextInput
                  placeholder={formatMessage({ id: getTrad('tokens.create.email.placeholder') })}
                  type="email"
                  name="create-token-email"
                  id="create-token-email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                  size="M"
                  style={{ fontSize: '14px' }}
                />
                <Typography 
                  variant="pi" 
                  textColor="neutral600" 
                  style={{ marginTop: '6px', fontSize: '12px' }}
                >
                  {formatMessage({ id: getTrad('tokens.create.email.hint') })}
                </Typography>
              </Box>
              
              {/* Gültigkeitsdauer */}
              <Box>
                <Typography 
                  variant="sigma" 
                  fontWeight="semiBold"
                  textColor="neutral800"
                  style={getLabelStyle()}
                >
                  {formatMessage({ id: getTrad('tokens.create.ttl.label') })}
                </Typography>
                <TextInput
                  type="number"
                  value={formData.ttl}
                  onChange={(e) => updateFormData('ttl', parseInt(e.target.value) || 24)}
                  min="1"
                  max="168"
                  size="M"
                  style={{ fontSize: '14px' }}
                />
                <Typography 
                  variant="pi" 
                  textColor="neutral600"
                  style={{ marginTop: '6px', fontSize: '12px' }}
                >
                  {formatMessage({ id: getTrad('tokens.create.ttl.hint') })}
                </Typography>
              </Box>
              
              {/* JSON Context */}
              <Box>
                <Typography 
                  variant="sigma" 
                  fontWeight="semiBold"
                  textColor="neutral800"
                  style={getLabelStyle()}
                >
                  {formatMessage({ id: getTrad('tokens.create.context.label') })}
                </Typography>
                <Textarea
                  placeholder={formatMessage({ id: getTrad('tokens.create.context.placeholder') })}
                  value={contextText}
                  onChange={handleContextChange}
                  style={{ 
                    fontSize: '13px', 
                    fontFamily: 'monospace',
                    minHeight: '100px',
                  }}
                />
                {contextError ? (
                  <Typography 
                    variant="pi" 
                    textColor="danger600" 
                    style={{ marginTop: '6px', fontSize: '12px' }}
                  >
                    ⚠️ {contextError}
                  </Typography>
                ) : (
                  <Typography 
                    variant="pi" 
                    textColor="neutral600"
                    style={{ marginTop: '6px', fontSize: '12px' }}
                  >
                    {formatMessage({ id: getTrad('tokens.create.context.hint') })}
                  </Typography>
                )}
              </Box>
              
              {/* E-Mail senden Checkbox */}
              <Box 
                background="neutral100"
                padding={4}
                style={{ borderRadius: '6px' }}
              >
                <Checkbox
                  checked={!!formData.sendEmail}
                  onCheckedChange={(checked) => updateFormData('sendEmail', !!checked)}
                >
                  <Typography variant="pi" fontWeight="medium">
                    {formatMessage({ id: getTrad('tokens.create.sendEmail.label') })}
                  </Typography>
                </Checkbox>
                {formData.sendEmail && (
                  <Typography 
                    variant="omega" 
                    textColor="neutral600"
                    style={{ marginTop: '4px', marginLeft: '28px', fontSize: '11px' }}
                  >
                    {formatMessage({ id: getTrad('tokens.create.sendEmail.hint') })}
                  </Typography>
                )}
              </Box>
            </Flex>
          </Box>

          {/* Footer */}
          <Box 
            paddingTop={4}
            paddingLeft={7}
            paddingRight={7}
            paddingBottom={6}
            style={{
              borderTop: '1px solid #f1f1f1',
              backgroundColor: '#fafafa',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
            }}
          >
            <Flex justifyContent="flex-end" gap={3}>
              <Button 
                type="button"
                onClick={onClose} 
                variant="tertiary"
                size="M"
              >
                {formatMessage({ id: getTrad('tokens.create.cancel') })}
              </Button>
              <Button
                type="submit"
                startIcon={<Sparkle />}
                size="M"
                style={{
                  background: 'linear-gradient(135deg, #5B3AE1 0%, #8B5CF6 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
                }}
                disabled={!formData.email || !!contextError}
              >
                {formatMessage({ id: getTrad('tokens.create.submit') })}
              </Button>
            </Flex>
          </Box>
        </Box>
      </div>
  );
};

export default CreateTokenModal;