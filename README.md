# Generation'26

Static site for **Generation'26** — Lotus Tower Open Arena, Colombo,
Saturday 12 December 2026. Produced by Echem.

Two pages, one stylesheet, one script, and the media they use. No build
step, no framework, no dependencies, nothing to install.

```
index.html            home
auditions.html        the eleven audition streams
site.webmanifest
assets/css/gen-v2.css
assets/js/gen-v2.js
assets/images/gen/    photos and video posters
assets/images/favicon/
assets/images/og/     social preview cards
```

## Running it locally

Any static server will do — the pages use relative paths throughout, so
they also work from a subdirectory.

```
python -m http.server 4200
```

Then open <http://localhost:4200>.

## Hosting

Works as-is on GitHub Pages or Vercel with no configuration. On Pages,
set **Settings -> Pages -> Deploy from a branch** to this branch and
`/ (root)`. On Vercel, import the repo and leave the framework preset as
**Other**; there is no build command and the output directory is the
repository root.

`.nojekyll` is present so Pages serves the tree verbatim.

## Note on the meta tags

`og:image`, `og:url` and `canonical` point at the production domain
`generation26.lk`. Link previews will keep pointing there until that
domain serves this site — change those three in both pages if this
deployment is meant to be the canonical one.
