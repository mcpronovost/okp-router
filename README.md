# okp-router &middot; [![npm version](https://img.shields.io/npm/v/@mcpronovost/okp-router.svg?style=flat)](https://www.npmjs.com/package/@mcpronovost/okp-router) [![npm license](https://img.shields.io/npm/l/@mcpronovost/okp-router?color=%231081c2)](https://github.com/mcpronovost/okp-router/blob/main/LICENSE)

OKP Router for Vite-based projects.

## Installation

```bash
npm install @mcpronovost/okp-router
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
});
```

## Usage

```ts
import { findRoute } from "@mcpronovost/okp-router";

const [OkpView, setOkpView] = useState(null);

const route = findRoute("/", "en");
const [_, { view }] = route;
const viewPath = `./views/${view}.jsx`;
const viewModule = await views[viewPath]();

setOkpView(() => viewModule.default);

return <OkpView />;
```

## Peer Dependencies

- **[Vite](https://vitejs.dev/)** - Build tool

## License

This project is licensed under the [BSD-3-Clause License](LICENSE).
