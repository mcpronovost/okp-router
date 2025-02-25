# okp-router &middot; [![npm version](https://img.shields.io/npm/v/@mcpronovost/okp-router.svg?style=flat)](https://www.npmjs.com/package/@mcpronovost/okp-router) [![npm license](https://img.shields.io/npm/l/@mcpronovost/okp-router?color=%231081c2)](https://github.com/mcpronovost/okp-router/blob/main/LICENSE) &middot; [![made in Canada](https://img.shields.io/badge/made%20in-Canada-FF0000)](#) [![made in Québec](https://img.shields.io/badge/fait%20au-Québec-003399)](#)

OKP Router is a lightweight routing solution specifically designed for Vite-based projects with multilingual support.

## Features

1. **Multilingual support**
   - Build-in language handling
   - URL-based language switching
   - Configurable default and supported languages
   - Automatic fallback to default language
2. **Dynamic routes**
   - Nested route support
   - Parameter handling in URLs
   - Automatic 404 handling
3. **View management**
   - Lazy loading of views
   - Caching of views
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
  currentLang: "en",
  supportedLangs: ["en"],
  viewExtension: "jsx",
  routes: {},
  routeModules: undefined,
  views: {},
  viewsPath: "/src/views",
  viewsExtensions: ["jsx", "tsx"],
}
```

### Direct Configuration

Define your routes and views directly in the configuration object.

```ts
import { initRouter } from "@mcpronovost/okp-router";

await initRouter({
  defaultLang: "en",
  currentLang: "en",
  supportedLangs: ["en", "fr"],
  viewsPath: "/src/pages",
  viewsExtensions: ["jsx", "tsx"],
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
    "./views/Settings/Edit.tsx": () => import("./views/Settings/Edit.tsx"),
  },
});
```

### Module-based Configuration

Use Vite's glob pattern to import routes and views from modules.

```ts
import { initRouter } from "@mcpronovost/okp-router";

await initRouter({
  defaultLang: "en",
  currentLang: "fr",
  supportedLangs: ["en", "fr"],
  viewsPath: "/src/pages",
  routeModules: import.meta.glob("./routes/**/*.js", {
    eager: true,
  }),
  views: import.meta.glob("./views/**/*.{jsx,tsx}", {
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

Get the current view and its parameters based on the current URL.

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

Use the route key to get the translated URL for the current language.

```ts
import { r } from "@mcpronovost/okp-router";

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page</p>
      <a href={r("devblog")}>Go to Devblog</a>
    </div>
  );
}
```

Use the route key to get the translated URL for a specific language.

```ts
import { getRouter } from "@mcpronovost/okp-router";

export default function Home() {
  const { r } = getRouter("fr");

  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page</p>
      <a href={r("devblog")}>Go to Devblog</a>
    </div>
  );
}
```

Switch the language of the current route.

```ts
import { switchLang } from "@mcpronovost/okp-router";

const newRoute = switchLang("fr");
```

## Peer Dependencies

- **[Vite](https://vitejs.dev/)** (version 6 or higher)

## License

This project is licensed under the [BSD-3-Clause License](LICENSE).
