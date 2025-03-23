import * as yup from 'yup';

const schema = yup.object().shape({
  enabled: yup.boolean().required(),
  createUserIfNotExists: yup.boolean().required(),
  stays_valid: yup.boolean().required(),
  confirmationUrl: yup.string().required(),
  token_length: yup.number().min(5).required(),
  expire_period: yup.number().min(10).required(),
  object: yup.string().required(),
  from_name: yup.string().required(),
  from_email: yup.string().email().required(),
  response_email: yup.string().email(),
  message_html: yup.string().required(),
  message_text: yup.string().required(),
});

export default schema; 