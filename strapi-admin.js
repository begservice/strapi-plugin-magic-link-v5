import { PLUGIN_ID } from './admin/src/pluginId';
import pluginPermissions from './admin/src/permissions';
import Initializer from './admin/src/components/Initializer/index.jsx';
import { PluginIcon } from './admin/src/components/PluginIcon/index.jsx';
import getTrad from './admin/src/utils/getTrad';

const pluginId = PLUGIN_ID;

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Magic Link',
      },
      Component: async () => {
        const component = await import('./admin/src/pages/App/index.jsx');
        return component.default;
      },
    });

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
          to: `/settings/${pluginId}`,
          Component: async () => {
            const component = await import('./admin/src/pages/Settings/index.jsx');
            return component.default;
          },
          permissions: pluginPermissions.readSettings,
        },
      ]
    );

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: true,
      name: pluginId,
    });
  },

  bootstrap() {},

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(
          /* webpackChunkName: "magic-link-translation-[request]" */ `./admin/src/translations/${locale}.json`
        )
          .then(({ default: data }) => {
            return {
              data: app.prefixPluginTranslations(data, pluginId),
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