// @ts-check
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import { PLUGIN_ID } from './pluginId';
import getTrad from './utils/getTrad';
import reducers from './reducers';
import permissions from './permissions';
import PluginIcon from './components/PluginIcon/index.jsx';
import pluginId from './pluginId';

const name = 'strapi-plugin-magic-link-v5';

const icon = PluginIcon;

export default {
  register(app) {
    app.addReducers(reducers);

    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Magic Link',
      },
      Component: async () => {
        const component = await import('./pages/App');
        return component;
      },
      permissions: [
        {
          action: `plugin::${pluginId}.read`,
          subject: null,
        },
      ],
    });

    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: getTrad('Settings.header'),
          defaultMessage: 'Magic Link',
        },
      },
      [
        {
          id: 'strapi-plugin-magic-link-v5-settings',
          intlLabel: {
            id: getTrad('Settings.subHeader'),
            defaultMessage: 'Settings',
          },
          Component: async () => {
            const component = await import('./pages/Settings');
            return component;
          },
          permissions: permissions.accessSettings,
        },
      ]
    );
  },

  bootstrap() {},

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
