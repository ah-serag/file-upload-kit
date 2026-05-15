# multer-upload-manager

A flexible, production-ready file upload package built on top of **Multer** — supports every file type you'll ever need in real projects.

---

## Installation

```bash
npm install multer-upload-manager
```

---

## Supported File Types

| Group       | Extensions                                             | Default Limit |
|-------------|--------------------------------------------------------|---------------|
| Images      | jpg, jpeg, png, gif, webp, svg, bmp, tiff, ico, avif  | 5 MB          |
| Videos      | mp4, mpeg, mov, webm, ogg, avi, mkv, 3gp, flv         | 100 MB        |
| Audio       | mp3, wav, ogg, aac, flac, m4a, opus                   | 20 MB         |
| PDF         | pdf                                                    | 10 MB         |
| Word        | doc, docx, odt                                         | 10 MB         |
| Excel       | xls, xlsx, ods, csv                                    | 10 MB         |
| PowerPoint  | ppt, pptx, odp                                         | 20 MB         |
| Text        | txt, html, css, js, json, xml, md, rtf                | 5 MB          |
| Code        | js, ts, py, java, sh, c, cpp, json, xml, yaml         | 5 MB          |
| Archives    | zip, rar, 7z, tar, gz, bz2                             | 50 MB         |
| Fonts       | ttf, otf, woff, woff2                                  | 5 MB          |
| 3D Models   | gltf, glb, fbx, obj, stl                               | 50 MB         |

---

## Usage Examples

### Images

```js
const { uploadImages, uploadImageFields } = require("multer-upload-manager");

// Array upload — all image types accepted
router.post("/photos", uploadImages("photos", 5), (req, res) => {
  res.json({ files: req.files });
});

// Restrict to PNG only via `allow`
router.post("/avatars", uploadImages("avatar", 1, 2, ["image/png"], "memory"), (req, res) => {
  res.json({ file: req.files });
});

// Multiple fields
router.post("/profile",
  uploadImageFields([{ name: "avatar", maxCount: 1 }, { name: "cover", maxCount: 1 }], 5),
  (req, res) => res.json(req.files)
);
```

### Videos

```js
const { uploadVideos, uploadVideoFields } = require("multer-upload-manager");

router.post("/clips", uploadVideos("video", 3, 200), (req, res) => {
  res.json({ files: req.files });
});
```

### Audio

```js
const { uploadAudio } = require("multer-upload-manager");

// Accept mp3 only
router.post("/tracks",
  uploadAudio("track", 10, 30, ["audio/mpeg"], "disk"),
  (req, res) => res.json({ files: req.files })
);
```

### PDF

```js
const { uploadPDF, uploadPDFs } = require("multer-upload-manager");

// Single PDF
router.post("/resume", uploadPDF("resume", 5), handler);

// Multiple PDFs
router.post("/docs", uploadPDFs("documents", 10, 20), handler);
```

### Word / Excel / PowerPoint

```js
const { uploadWordFile, uploadExcelFile, uploadPowerPoint } = require("multer-upload-manager");

router.post("/contract",  uploadWordFile("file", 15), handler);
router.post("/report",    uploadExcelFile("file", 10), handler);
router.post("/slides",    uploadPowerPoint("file", 30), handler);
```

### Documents (mixed types in one call)

```js
const { uploadDocuments } = require("multer-upload-manager");

// Accept PDF + Word + Excel in one middleware
router.post("/submit",
  uploadDocuments(
    [{ name: "attachment", maxCount: 3 }],
    ["pdf", "word", "excel"],
    20
  ),
  handler
);
```

### Archives

```js
const { uploadArchive } = require("multer-upload-manager");

// Restrict to zip only
router.post("/upload-zip",
  uploadArchive("archive", 50, ["application/zip"]),
  handler
);
```

### Mixed Media (images + videos)

```js
const { uploadMixedMedia } = require("multer-upload-manager");

router.post("/media",
  uploadMixedMedia([
    { name: "thumbnail", maxCount: 1 },
    { name: "video",     maxCount: 1 }
  ], 150),
  handler
);
```

### Custom (your own mime list)

```js
const { uploadCustom } = require("multer-upload-manager");

router.post("/anything",
  uploadCustom("file", 5, ["application/pdf", "image/png"], 10, "memory"),
  handler
);
```

---

## API Reference

Every function follows the same pattern:

```
upload<Type>(fieldName, [maxCount], [limitInMB], [allow], [storageType])
```

| Parameter     | Type            | Default  | Description                                           |
|---------------|-----------------|----------|-------------------------------------------------------|
| `fieldName`   | `string`        | required | The HTML form field name                              |
| `maxCount`    | `number`        | —        | Max number of files (for `.array()` methods)          |
| `limitInMB`   | `number`        | varies   | File size limit in MB                                 |
| `allow`       | `string[]|null` | `null`   | Whitelist specific MIME types. `null` = accept all    |
| `storageType` | `string`        | `"disk"` | `"disk"` or `"memory"`                               |

### The `allow` parameter

Passing `allow` lets you restrict which MIME types are accepted within a group:

```js
// Only accept PNG and WebP, reject JPEG/GIF/etc.
uploadImages("photo", 1, 2, ["image/png", "image/webp"])

// Only accept MP3 audio
uploadAudio("track", 5, 20, ["audio/mpeg"])

// Only accept ZIP archives
uploadArchive("file", 10, ["application/zip"])
```

If `allow` is `null` (default), all MIME types for that group are accepted.

---

## MIME Registry

You can inspect all registered MIME types at runtime:

```js
const { MIME_REGISTRY } = require("multer-upload-manager");

console.log(MIME_REGISTRY.image.mimes);
// ["image/jpeg", "image/jpg", "image/png", ...]
```

---

## Error Responses

On validation failure the middleware returns:

```json
{
  "success": false,
  "message": "File too large. Maximum size for images is 5MB."
}
```

| Scenario                | HTTP Status | Message                            |
|-------------------------|-------------|-------------------------------------|
| Wrong MIME type         | 400         | `Invalid file type (...). Allowed: ...` |
| File too large          | 400         | `File too large. Maximum size is XMB.` |
| Too many files          | 400         | `Exceeded allowed count. Maximum is N.` |

---

## License

MIT
