// React Native 0.81.x ships a URL polyfill (Libraries/Blob/URL.js) where
// every URL instance property is defined only as a getter — no setters.
// In Hermes strict mode, assigning to a getter-only property throws
//   TypeError: Cannot assign to property 'X' which has only a getter
// expo-asset's getManifestBaseUrl() assigns to protocol, pathname, search,
// and hash at module-init time, crashing the app before it renders.
//
// This file MUST be the first import in App.jsx so it runs before
// expo-font → expo-asset → PlatformUtils.js is loaded.

(function patchURLSetters() {
  if (typeof URL === 'undefined') return;

  const proto = URL.prototype;

  function patchSetter(name, setter) {
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    if (desc && !desc.set) {
      Object.defineProperty(proto, name, {
        get: desc.get,
        set: setter,
        configurable: true,
        enumerable: desc.enumerable !== false,
      });
    }
  }

  // Replace scheme portion: "exp:" → "http:", "exps:" → "https:", etc.
  patchSetter('protocol', function (val) {
    const p = val.endsWith(':') ? val : val + ':';
    this._url = this._url.replace(/^[a-zA-Z][a-zA-Z0-9+\-.]*:/, p);
  });

  // Replace path portion (between authority and ?/#/end).
  patchSetter('pathname', function (val) {
    this._url = this._url.replace(
      /^([a-zA-Z][a-zA-Z0-9+\-.]*:\/\/[^/?#]*)([^?#]*)/,
      (_, authority) => authority + val
    );
  });

  // Replace or remove the query string.
  patchSetter('search', function (val) {
    this._url = val
      ? this._url.replace(/(\?[^#]*)?(#.*)?$/, (_, _q, h) => val + (h || ''))
      : this._url.replace(/\?[^#]*/, '');
  });

  // Replace or remove the fragment.
  patchSetter('hash', function (val) {
    this._url = val
      ? this._url.replace(/#.*$/, val)
      : this._url.replace(/#.*$/, '');
  });
})();
