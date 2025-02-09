# okp-router &middot; [![npm version](https://img.shields.io/npm/v/@mcpronovost/okp-router.svg?style=flat)](https://www.npmjs.com/package/@mcpronovost/okp-router) [![npm license](https://img.shields.io/npm/l/@mcpronovost/okp-router?color=%231081c2)](https://github.com/mcpronovost/okp-router/blob/main/LICENSE)

OKP Router for Vite-based projects.

## Installation

```bash
npm i @mcpronovost/okp-router
```

## Configuration

```ts
import { initRouter } from "@mcpronovost/okp-router";

initRouter({
  defaultLang: "en",
  routes: {
    "/": {
      component: "Home",
    },
  },
  views: {
    "./views/Home.jsx": () => import("./views/Home.jsx"),
  },
});
```

or

```ts
import { initRouter } from "@mcpronovost/okp-router";

initRouter({
  defaultLang: import.meta.env.VITE_DEFAULT_LANGUAGE,
  routeModules: import.meta.glob("./routes/**/*.js", {
    eager: true,
  }),
  views: import.meta.glob("./views/**/*.jsx", {
    eager: false,
  })
});
```

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

- **[Vite](https://vitejs.dev/)** - Build tool

## License

This project is licensed under the [BSD-3-Clause License](LICENSE).
