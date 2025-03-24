import { useFetchClient } from '@strapi/strapi/admin';
import getRequestURL from '../../../utils/getRequestURL';

const fetchData = async () => {
  const { get } = useFetchClient();
  const { data } = await get(getRequestURL('settings'));
  return data.settings;
};

const saveSettings = async (body) => {
  const { put } = useFetchClient();
  return put(getRequestURL('settings'), body);
};

export { fetchData, saveSettings }; 