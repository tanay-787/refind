# Privacy Policy for Refind

**Effective Date:** November 9, 2026  
**Last Updated:** November 9, 2026  

Refind ("the Application", "we", "our") is an open-source, on-device screenshot search engine and text extraction tool for Android (`com.tanay22.refind`), created by Tanay Gupte.

Your privacy is fundamental to the philosophy and architecture of Refind. **Refind does not collect, transmit, store, or share any personal data.** Everything occurs entirely on your device.

---

## 1. Zero Cloud & Zero Telemetry Guarantee

- **No Remote Servers**: Refind does not communicate with external servers. All text recognition (OCR), metadata extraction, keyword indexing, and searches are performed locally on your physical device.
- **No Third-Party Analytics**: Refind contains no tracking SDKs, no advertising frameworks, and no crash-reporting telemetries (no Firebase, no Google Analytics, no telemetry beacons).
- **No Account Required**: You do not need to register, provide an email address, or sign in to use Refind.

---

## 2. On-Device Data Processing

- **Screenshots & Images**: The Application accesses screenshots stored in your device's media library strictly to extract text and generate local search indices. Your images never leave your device.
- **Extracted Text & Search Index**: All extracted text, bounding-box coordinates, and generated index tokens are stored in a private SQLite database inside the application's secure sandbox on your device.
- **Search Queries**: When you type a search term, the query is executed directly against your local SQLite FTS5 database. Queries are never logged, recorded, or transmitted over the internet.

---

## 3. Permissions Requested & Why

Refind requests only the minimal Android permissions necessary to function:

| Permission | Purpose |
|---|---|
| `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` | Required to read and display screenshots from your local gallery. |
| `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_DATA_SYNC` | Ensures the operating system does not prematurely kill indexing workers while processing screenshots. |
| `POST_NOTIFICATIONS` | Displays a persistent notification showing indexing progress and providing Pause / Resume controls. |
| `ACCESS_MEDIA_LOCATION` | Reads chronological capture timestamps to preserve screenshot ordering in search results. |

---

## 4. Third-Party Libraries

Refind uses Google ML Kit's on-device text recognition engine with bundled offline models. Because models are bundled directly within the application binary, no network connection to Google Play Services is required for OCR.

---

## 5. Open Source & Transparency

Refind is distributed under the **Apache License, Version 2.0**. The source code is publicly available for independent security and privacy auditing:

- **Source Code Repository**: [https://github.com/tanay-787/refind](https://github.com/tanay-787/refind)

---

## 6. Contact

If you have questions or concerns regarding this Privacy Policy, please open an issue on the project's GitHub repository:

- **Issue Tracker**: [https://github.com/tanay-787/refind/issues](https://github.com/tanay-787/refind/issues)
