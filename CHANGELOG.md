# Changelog

All notable changes to this project are documented here.

## [Unreleased]

- Initial project scaffold.
- Replace random `picsum.photos` product images with generated gradient covers + per-product emoji
  (`scripts/gen-covers.js` -> `miniprogram/mock/covers.ts`). First screen now issues zero image
  requests, works offline and always shows artwork that matches the product.
- Add `ProductCard` projection: list endpoints no longer ship `images`, `skus`, `reviews` or
  `description` through `setData` (feed payload 83 KB -> 26 KB).
- Stop `setData`-ing the whole flash session on the flash sale page; only the fields the view needs.
- Skip redundant tab bar `setData` when the cart badge has not changed.
- Rewrite `NTCRANFILE.yaml` with `verify`, `checks`, `test`, `ci`, `backend`, `landing`, `covers`,
  `clean`, `doctor`, `setup` targets and wire CI to `npm test`.
- Rebuild `index.html` as the project landing page.
