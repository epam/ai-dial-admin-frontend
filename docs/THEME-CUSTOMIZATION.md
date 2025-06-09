# Theme Customization

You can tailor the appearance of your application using **themes** - a collection of static resources including images, fonts, and colors. AI DIAL Admin provides two pre-set themes - dark (which is the default theme) and light. However, you can deploy a specific service that allows you to modify the default themes or create and configure your own custom themes. This independent service allows you to alter themes without having to rebuild the the application Docker image.

**Note**: after making changes into themes, it is necessary to restart the application to apply changes.

> Refer to [AI DIAL Chat Themes](https://github.com/epam/ai-dial-chat-themes) to learn how to deploy and configure a special server for application themes.

## Configuration

If you want to use any other than default themes, deploy `ai-dial-chat-themes` and create custom configurations.

When this service is deployed, provide a `THEMES_CONFIG_URL` environment variable in the AI DIAL Admin configuration containing the URL to your nginx server with themes (can be both public and private). This ensures that the application fetches the configuration file with themes during loading. If the environment variable is not provided, [default themes and model icons](https://github.com/epam/ai-dial-chat-themes/blob/development/static/config.json) will be applied.

```bash
THEMES_CONFIG_URL=https://your-config-host.com
```

After setting the `THEMES_CONFIG_URL` environment variable, you can [add and customize themes](https://github.com/epam/ai-dial-chat-themes/blob/development/static/config.json). 

> Please note that after making modifications, you need to redeploy the server with themes for the changes to take effect. There is a default cache period of 24 hours, after which the new settings will be applied automatically.
