import getTrad from '../../../utils/getTrad';

const layout = {
  enabled: {
    input: {
      label: { id: getTrad('Settings.enabled.label') },
      description: { id: getTrad('Settings.enabled.description') },
      type: 'bool',
    },
    grid: { col: 6 },
  },
  createUserIfNotExists: {
    input: {
      label: { id: getTrad('Settings.createUser.label') },
      description: { id: getTrad('Settings.createUser.description') },
      type: 'bool',
    },
    grid: { col: 6 },
  },
  token_length: {
    input: {
      label: { id: getTrad('Settings.token_length.label') },
      description: { id: getTrad('Settings.token_length.description') },
      type: 'number',
    },
    grid: { col: 6 },
  },
  expire_period: {
    input: {
      label: { id: getTrad('Settings.expire_period.label') },
      description: { id: getTrad('Settings.expire_period.description') },
      type: 'number',
    },
    grid: { col: 6 },
  },
  stays_valid: {
    input: {
      label: { id: getTrad('Settings.stays_valid.label') },
      description: { id: getTrad('Settings.stays_valid.description') },
      type: 'bool',
    },
    grid: { col: 6 },
  },
  confirmationUrl: {
    input: {
      label: { id: getTrad('Settings.confirmationUrl.label') },
      description: { id: getTrad('Settings.confirmationUrl.description') },
      type: 'text',
    },
    grid: { col: 6 },
  },
  object: {
    input: {
      label: { id: getTrad('Email.options.object.label') },
      placeholder: { id: getTrad('Email.options.object.placeholder') },
      type: 'text',
    },
    grid: { col: 6 },
  },
  from_name: {
    input: {
      label: { id: getTrad('Email.options.from.name.label') },
      placeholder: { id: getTrad('Email.options.from.name.placeholder') },
      type: 'text',
    },
    grid: { col: 6 },
  },
  from_email: {
    input: {
      label: { id: getTrad('Email.options.from.email.label') },
      placeholder: { id: getTrad('Email.options.from.email.placeholder') },
      type: 'email',
    },
    grid: { col: 6 },
  },
  response_email: {
    input: {
      label: { id: getTrad('Email.options.response_email.label') },
      placeholder: { id: getTrad('Email.options.response_email.placeholder') },
      type: 'email',
    },
    grid: { col: 6 },
  },
  message_html: {
    input: {
      label: { id: getTrad('Email.options.message_html.label') },
      type: 'textarea',
    },
    grid: { col: 12 },
  },
  message_text: {
    input: {
      label: { id: getTrad('Email.options.message_text.label') },
      type: 'textarea',
    },
    grid: { col: 12 },
  }
};

export default layout; 