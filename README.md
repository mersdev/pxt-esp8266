# ESP8266 AT Mode Extension for Microsoft MakeCode

This library provides the driver for [ESP8266 WiFi Grove Module](https://www.cytron.io/p-grv-wifi-8266).
This extension is tested with Espressif ESP-AT Firmware v2.2.0.

![ESP8266 WiFi Grove Module](https://raw.githubusercontent.com/CytronTechnologies/pxt-esp8266/master/icon.png)

## Initialization (Selecting UART Pins and Baudrate)

Initialize the ESP8266 module (Tx = P16, Rx = P15, Baudrate = 115200).

```blocks
esp8266.init(SerialPin.P16, SerialPin.P15, BaudRate.BaudRate115200)
```

Show happy face if successful.<br>
Show sad face if failed.

```blocks
if (esp8266.isESP8266Initialized()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}
```

## WiFi

Connect to WiFi router.

```blocks
esp8266.connectWiFi("my_ssid", "my_password")
```

Show happy face if connected successfully.<br>
Show sad face if failed.

```blocks
if (esp8266.isWifiConnected()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}
```

## Thingspeak

Upload data to Thingspeak (Data can only be uploaded every 15 seconds).

```blocks
esp8266.uploadThingspeak("my_write_api_key", 0, 1, 2, 3, 4, 5, 6, 7)
```

Show happy face if data is uploaded successfully.<br>
Show sad face if failed.

```blocks
if (esp8266.isThingspeakUploaded()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}
```

## Blynk

Read from Blynk.

```blocks
let value = esp8266.readBlynk("my_blynk_token", "V0")
```

Write to Blynk.

```blocks
esp8266.writeBlynk("my_blynk_token", "V1", "100")
```

Show happy face if Blynk was read/written successfully.<br>
Show sad face if failed.

```blocks
if (esp8266.isBlynkUpdated()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}
```

## Velozz

Pull data from Velozz.

```blocks
esp8266.pullVelozz("my_api_key")
let value = esp8266.getVelozzLastField(esp8266.VelozzLastField.Value)
```

Send data to Velozz.

```blocks
esp8266.sendVelozz("my_api_key", "light", "88")
```

Show happy face if Velozz was read/written successfully.<br>
Show sad face if failed.

```blocks
if (esp8266.isVelozzUpdated()) {
    basic.showIcon(IconNames.Happy)
} else {
    basic.showIcon(IconNames.Sad)
}
```

## Internet Time

Initialize internet time to timezone +8.<br>
Show sad face if failed.

```blocks
esp8266.initInternetTime(8)
if (!(esp8266.isInternetTimeInitialized())) {
    basic.showIcon(IconNames.Sad)
}
```

Update the internet time and show the time.<br>
Show sad face if failed.

```blocks
esp8266.updateInternetTime()
if (!(esp8266.isInternetTimeUpdated())) {
    basic.showIcon(IconNames.Sad)
} else {
    basic.showString(esp8266.getHour() + ":" + esp8266.getMinute() + ":" + esp8266.getSecond())
}
```

## MakeCode Onboarding

Use this repo as a MakeCode extension by publishing it on GitHub and importing that GitHub URL in the MakeCode editor.

1. Push this repository to GitHub.
2. Open [MakeCode micro:bit](https://makecode.microbit.org/).
3. Click `Extensions`.
4. Choose `Import URL`.
5. Paste your GitHub repo URL, for example `https://github.com/mersdev/pxt-esp8266`.
6. Test the blocks in a micro:bit project.
7. When the extension is ready to share, create a release tag so MakeCode can pick up the published version.

If you are working in a local PXT workspace, use:

```bash
pxt target microbit
pxt serve
```

Then open the served editor, import the GitHub repo, and verify the blocks there before creating a release.

## License

MIT

## Supported targets

* for PXT/microbit
