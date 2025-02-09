# okp-router &middot; [![npm version](https://img.shields.io/npm/v/@mcpronovost/okp-router.svg?style=flat)](https://www.npmjs.com/package/@mcpronovost/okp-router) [![npm license](https://img.shields.io/npm/l/@mcpronovost/okp-router?color=%231081c2)](https://github.com/mcpronovost/okp-router/blob/main/LICENSE) &middot; [![made in Canada](https://img.shields.io/badge/made%20in-Canada-FF0000)](#) [![made in Québec](https://img.shields.io/badge/fait%20au-Québec-003399)](#)

OKP Router is a lightweight routing solution specifically designed for Vite-based projects with multilingual support.

## Features

1. **Multilingual support**
   - Build-in language handling
   - URL-based language switching
   - Configurable default and supported languages
2. **Dynamic routes**
   - Nested route support
   - Parameter handling in URLs
   - Automatic 404 handling
3. **View management**
   - Lazy loading of views
   - Automatic view resolution
   - Props and parameters passing

## Installation

```bash
npm i @mcpronovost/okp-router
```

## Configuration

### Default Configuration

```ts
{
  defaultLang: "en",
  supportedLangs: ["en"],
  viewExtension: "jsx",
  routes: {},
  routeModules: undefined,
  views: {},
}
```

### Direct Configuration

Define your routes and views directly in the configuration object.

```ts
import { initRouter } from "@mcpronovost/okp-router";

initRouter({
  defaultLang: "en",
  supportedLangs: ["en", "fr"],
  viewExtension: "jsx",
  routes: {
    home: {
      view: "Home",
      paths: {
        en: "",
        fr: "",
      },
    },
    settings: {
      view: "Settings",
      paths: {
        en: "settings",
        fr: "parametres",
      },
      children: {
        edit: {
          view: "SettingsEdit",
          paths: {
            en: "settings/{settingId}/edit",
            fr: "parametres/{settingId}/modifier",
          },
        },
      },
    },
  },
  views: {
    "./views/Home.jsx": () => import("./views/Home.jsx"),
    "./views/Settings.jsx": () => import("./views/Settings.jsx"),
    "./views/Settings/Edit.jsx": () => import("./views/Settings/Edit.jsx"),
  },
});
```

### Module-based Configuration

Use Vite's glob pattern to import routes and views from modules.

```ts
import { initRouter } from "@mcpronovost/okp-router";

initRouter({
  defaultLang: "en",
  supportedLangs: ["en", "fr"],
  viewExtension: "tsx",
  routeModules: import.meta.glob("./routes/**/*.js", {
    eager: true,
  }),
  views: import.meta.glob("./views/**/*.tsx", {
    eager: false,
  }),
});
```

## Key Components

### Route Definition

- `view`: The view to display for the route.
- `paths`: The paths for the route in different languages.
- `props`: The props to pass to the view.
- `children`: The child routes for the route.

### View Management

- Views are lazy-loaded components.
- Configurable views extension.
- Automatic error handling with customizable 404 page.

### URL Structure

- Format: `/[lang]/[route]`
  - Example: `/fr/accueil`
- Fallback: `/[defaultLang]/[route]`
  - Example: `/en/home`
- Parameter handling: `/[lang]/[route]/{param}`
  - Example: `/en/settings/123`

## Example Usage

```ts
import { useEffect, useState } from "react";
import { getView } from "@mcpronovost/okp-router";
import Loading from "@/views/Loading";

function App() {
  const [View, setView] = useState(null);
  const [viewProps, setViewProps] = useState({});
  const [viewParams, setViewParams] = useState({});

  const initView = async () => {
    const { viewModule, props, params } = await getView();

    setViewProps(props);
    setViewParams(params);

    setView(() => viewModule.default);
  };

  useEffect(() => {
    initView();
  }, []);

  if (View) {
    return <View {...viewProps} {...viewParams} />;
  }

  return <Loading />;
}
```

## Peer Dependencies

- **[Vite](https://vitejs.dev/)** (version 6 or higher)

## License

This project is licensed under the [BSD-3-Clause License](LICENSE).
