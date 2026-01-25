

This folder contains placeholder SVG files for logos and icons. Replace these with your actual brand assets.

- **favicon.ico.svg** - Main favicon (32x32), displays in browser tabs
- **favicon-16x16.png.svg** - Small favicon for older browsers
- **favicon-32x32.png.svg** - Standard favicon
- **apple-touch-icon.png.svg** - iOS home screen icon (180x180)

- **logo.svg** - Main logo used in the application header (200x60)

- **og-image.svg** - Open Graph / Social media share image (1200x630)
  - Used when sharing on Facebook, Twitter, LinkedIn, etc.

All placeholders feature:
- Blue theme (#3b82f6) matching the brand color
- Heartbeat/pulse icon representing API health monitoring
- "API Vitals" text on the logo

1. Use a tool like [Real Favicon Generator](https://realfavicongenerator.net/)
2. Upload your logo design
3. Download the generated favicon package
4. Replace the .svg files with the actual .png/.ico files
5. Update the file references in `templates/layout.html` to remove the `.svg` extensions

1. Replace the placeholder SVG files with your own SVG designs
2. Maintain the same filenames
3. Ensure proper viewBox dimensions:
   - favicon.ico.svg: 32x32
   - favicon-16x16.png.svg: 16x16  
   - favicon-32x32.png.svg: 32x32
   - apple-touch-icon.png.svg: 180x180
   - logo.svg: adjust as needed (current: 200x60)
   - og-image.svg: 1200x630

Popular tools for creating icons and logos:
- **Figma** - Web-based design tool
- **Adobe Illustrator** - Professional vector graphics
- **Inkscape** - Free open-source vector editor
- **Canva** - Easy online graphic design tool

1. Clear browser cache
2. Visit http://localhost:8080
3. Check the browser tab icon

1. On iOS device, add website to home screen
2. Check the icon appearance

Test your og-image.svg using:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

`src/main/resources/static/`

All files are served from the root path (e.g., `/logo.svg`, `/favicon.ico.svg`)

- SVG files are scalable and work great for modern browsers
- For maximum compatibility, convert to PNG/ICO format
- Keep file sizes reasonable (especially og-image.svg < 1MB)
- Ensure proper contrast and visibility at small sizes for favicons
