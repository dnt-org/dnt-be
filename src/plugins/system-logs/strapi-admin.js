import pluginId from './admin/src/pluginId';
import PluginIcon from './admin/src/components/PluginIcon';

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: { id: 'system-logs.plugin.name', defaultMessage: 'System Logs' },
      Component: async () => import('./admin/src/pages/LogsPage'),
      permissions: [],
    });
  },
};