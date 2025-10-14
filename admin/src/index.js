import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import { Faders, Key } from '@strapi/icons';
import pluginPermissions from './permissions';
import getTrad from './utils/getTrad';

const name = pluginPkg.strapi.name;

export default {
  register(app) {
    // Zuerst das Plugin registrieren (WICHTIG in Strapi v5!)
    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });

    // Menu Link für Token-Verwaltung hinzufügen
    app.addMenuLink({
      to: `plugins/${pluginId}/tokens`,
      icon: PluginIcon,
      intlLabel: {
        id: getTrad('tokens.title'),
        defaultMessage: 'Magic Link Tokens',
      },
      Component: () => import(/* webpackChunkName: "magic-link-tokens" */ './pages/Tokens'),
      permissions: [], // Leeres Array = keine Permission-Prüfung nötig
    });

    // Settings Section erstellen
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: getTrad('Header.Settings'),
          defaultMessage: 'Magic Link',
        },
      },
      [
        {
          intlLabel: {
            id: getTrad('Form.title.Settings'),
            defaultMessage: 'Settings',
          },
          id: 'magic-link-settings',
          to: `${pluginId}/config`,
          Component: () => import(/* webpackChunkName: "magic-link-settings" */ './pages/Settings'),
          permissions: pluginPermissions.readSettings,
        },
        {
          intlLabel: {
            id: getTrad('Form.title.License'),
            defaultMessage: 'License',
          },
          id: 'magic-link-license',
          to: `${pluginId}/license`,
          Component: () => import(/* webpackChunkName: "magic-link-license" */ './pages/License'),
          permissions: [],
        },
      ]
    );
  },

  bootstrap() {
    // Nothing to do here
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(
          /* webpackChunkName: "magic-link-translation-[request]" */ `./translations/${locale}.json`
        )
          .then(({ default: data }) => {
            return {
              data: data,
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
