# MakeCode Submission Notes

## Extension Information
- Name: `pxt-esp8266`
- Target: `microbit`
- Main capability: ESP8266 AT-mode networking extension, now including HTTP web server request handling (`GET`/`POST`) with customizable response body and status code.

## Credits (Required)
Please include this exact attribution in submission text:

> This extension is developed by **Cytron Technologies Sdn Bhd** and maintained by contributors in this repository.

## Good Use Case to Highlight
Use case title: **Micro:bit Webhook Receiver / Local IoT Endpoint**

Summary:
- micro:bit + ESP8266 hosts a lightweight HTTP endpoint on local WiFi.
- A web app sends `GET` or `POST` requests to trigger device actions.
- Device parses method/path/body and returns customizable plain-text HTTP response.

Example flow:
1. `esp8266.startWebServer(80)`
2. `esp8266.setWebResponse("ack", 200)`
3. In loop, call `esp8266.handleWebRequest(100)`
4. Read request data via:
   - `esp8266.lastWebRequestMethod()`
   - `esp8266.lastWebRequestPath()`
   - `esp8266.lastWebRequestBody()`

## Pre-Submission Checklist
- Run `pxt build` successfully.
- Run `pxt test` successfully.
- Confirm README documents the web server blocks.
- Confirm no secrets in examples (`my_ssid`, `my_password`, tokens placeholders only).
- Tag a release version in Git before publishing update.

## Submission Channels
- Import by GitHub URL in MakeCode and verify blocks render.
- Publish/update extension from repository release.
- Include attribution sentence above in release notes and README.
