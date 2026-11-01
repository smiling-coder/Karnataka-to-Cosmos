# Karnataka to Cosmos 🚀

A cinematic, responsive space-exploration website celebrating Karnataka Rajyotsava and India's space journey. Built with HTML, CSS, JavaScript and Three.js.

## Project files

- `index.html` — page structure, navigation, mission cards and NASA API panels
- `style.css` — cinematic dark UI, responsive layout, cards and animations
- `script.js` — Three.js scenes, interactive planet selector, mobile navigation and NASA API integration

## Features

- Interactive 3D Earth scene with textures, atmospheric glow, starfield and illustrative satellites
- Second 3D planet scene with selectable Earth, Moon, Mars and Jupiter
- Orbit controls: drag to rotate and scroll to zoom
- Karnataka Rajyotsava visual identity and Bengaluru/India-in-space content
- NASA Astronomy Picture of the Day (APOD) integration
- NASA Near Earth Object Web Service (NeoWs) integration
- Explicit labelling of live API data versus illustrative 3D simulations
- Responsive mobile navigation and reduced-motion support

## Run locally

**Recommended:** serve the files over HTTP rather than opening `index.html` with `file://`, because JavaScript ES modules and browser security rules may block imports when opened directly.

### Option A — VS Code Live Server
1. Extract the ZIP.
2. Open the `karnataka-to-cosmos` folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html` → **Open with Live Server**.

### Option B — Python local server
If Python is installed, open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## NASA API notes

The project uses these public endpoints with NASA's shared `DEMO_KEY`:
- APOD: `https://api.nasa.gov/planetary/apod`
- NeoWs: `https://api.nasa.gov/neo/rest/v1/feed`

`DEMO_KEY` has strict shared rate limits and can be temporarily unavailable. For more reliable usage, request a personal key at https://api.nasa.gov/ and replace `DEMO_KEY` in `script.js`. Do not commit a private key to a public repository if your usage terms or security requirements say to keep it private. For a public portfolio, a backend proxy/serverless function is safer for a private key.

The NeoWs panel requests the current UTC date. Its “potentially hazardous” number is NASA's classification from the feed, not a live collision prediction or warning.

## Simulation vs. real data

**Live API data:** NASA APOD title/media/date and NeoWs objects/distances/classification when API requests succeed.

**Illustrative simulation:** The 3D Earth, planet textures, satellite meshes, orbital rings, planet positions, movement and camera effects. These are not connected to live satellite telemetry, precise orbital ephemerides or a real collision-risk calculation. Planet sizes and distances are not to scale.

**Curated educational content:** The India-in-space section is descriptive editorial content, not a live mission status feed.

## Deploy free with GitHub Pages

1. Create a new **Public** repository on GitHub, e.g. `karnataka-to-cosmos`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then click **Save**.
6. Wait for the workflow to finish. Your site URL will be similar to:
   `https://YOUR-USERNAME.github.io/karnataka-to-cosmos/`

## Before publishing

- Test on mobile and desktop, including WebGL availability.
- Check that Three.js textures load on the network you use.
- Test the NASA APIs; shared DEMO_KEY quotas may be exhausted.
- Use only images/textures you have permission to use and follow source terms.
- Add your own GitHub/Instagram link and project attribution if desired.
