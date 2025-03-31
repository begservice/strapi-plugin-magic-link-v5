import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import pluginPermissions from './permissions';
import getTrad from './utils/getTrad';

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
      }))
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
          Component: () => import('./pages/Settings').then(module => ({
            default: module.default
          })),
          permissions: pluginPermissions.readSettings,
        },
      ]
    );

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });
  },

  bootstrap() {
    // Nothing to do here
  },
};
