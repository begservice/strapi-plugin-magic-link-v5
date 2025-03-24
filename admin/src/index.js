// import { prefixPluginTranslations } from '@strapi/strapi/admin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import pluginPermissions from './permissions';
import getTrad from './utils/getTrad';
import prefixPluginTranslations from './utils/prefixPluginTranslations';

const name = pluginPkg.strapi.name;

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      Component: () => import('./pages/HomePage').then(module => ({
        default: module.default
      }))
    });

    app.addMenuLink({
      to: `/plugins/${pluginId}/tokens`,
      icon: PluginIcon,
      intlLabel: {
        id: getTrad('tokens.title'),
        defaultMessage: 'Magic Link Tokens',
      },
      Component: () => import('./pages/Tokens').then(module => ({
        default: module.default
      })),
      isDisplayed: false,
    });

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });

    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: getTrad('Settings.header.title'),
          defaultMessage: 'Magic Link',
        },
      },
      [
        {
          intlLabel: {
            id: getTrad('Settings.general.title'),
            defaultMessage: 'Settings',
          },
          id: 'settings',
          to: `/settings/${pluginId}`,
          Component: () => import('./pages/Settings').then(module => ({
            default: module.default
          })),
          permissions: pluginPermissions.readSettings,
        },
      ]
    );
  },

  bootstrap() {
    // Nothing to do here
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map(locale => {
        try {
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
        } catch (error) {
          return {
            data: {},
            locale,
          };
        }
      })
    );

    return Promise.resolve(importedTrads);
  },
};
