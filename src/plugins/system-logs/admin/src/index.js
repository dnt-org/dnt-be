import pluginId from './pluginId';
import PluginIcon from './components/PluginIcon';

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: { id: 'system-logs.plugin.name', defaultMessage: 'System Logs' },
      Component: async () => import('./pages/LogsPage'),
      permissions: [],
    });
  },
};