# Theme Customization

You can tailor the appearance of your application using **themes** - a collection of static resources including images, fonts, and colors. AI DIAL Admin provides two pre-set themes - light (which is the default theme) and dark. However, you can deploy a specific service that allows you to modify the default themes or create and configure your own custom themes. This independent service allows you to alter themes without having to rebuild the the application Docker image.

**Note**: the application picks up theme changes on its own, without a restart. See [Caching](#caching) for how long that takes.

> Refer to [AI DIAL Chat Themes](https://github.com/epam/ai-dial-chat-themes) to learn how to deploy and configure a special server for application themes.

## Configuration

If you want to use any other than default themes, deploy `ai-dial-chat-themes` and create custom configurations.

When this service is deployed, provide a `THEMES_CONFIG_URL` environment variable in the AI DIAL Admin configuration containing the URL to your nginx server with themes (can be both public and private). This ensures that the application fetches the configuration file with themes during loading. If the environment variable is not provided, [default themes and model icons](https://github.com/epam/ai-dial-chat-themes/blob/development/static/config.json) will be applied.

```bash
THEMES_CONFIG_URL=https://your-config-host.com
```

After setting the `THEMES_CONFIG_URL` environment variable, you can [add and customize themes](https://github.com/epam/ai-dial-chat-themes/blob/development/static/config.json).

Every theme in a custom config must define both color token sets: the legacy one (`bg-layer-0`…`bg-layer-4`, `controls-*`) and the ui-kit 2.0 one (`bg-layer-base`, `bg-layer-raised`, `bg-layer-sunken`, `bg-control-*`, `text-control-*`, `stroke-*`, `bg-gradient-*`, `shadow-*`). A token the config leaves out falls back to a value compiled into the app or into ui-kit, and ui-kit's fallbacks are light, so a dark theme missing the 2.0 set shows light controls.

> Please note that after making modifications, you need to redeploy the server with themes for the changes to take effect.

## Caching

AI DIAL Admin caches the theme for 30 minutes, so the themes server is not queried on every page load:

- **On the server**, the theme configuration, the image list and the images are kept for 30 minutes. The first page load after that window still gets the cached copy and refreshes it in the background, so new colors appear within about 30 minutes plus one page load.
- **In the browser**, theme images (logos, favicon, default model and addon icons) are kept for 30 minutes. For a day after that the browser shows its copy and checks for a newer one in the background. Together with the server cache, a changed image can take up to about an hour plus one page load to appear.

The server cache is kept on disk, so restarting the application process does not clear it; a new container starts with an empty cache.
