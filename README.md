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

## Web Server

Start web server at port 80.

```blocks
esp8266.startWebServer(80)
```

Set customizable response text and status code.

```blocks
esp8266.setWebResponse("Hello from micro:bit", 200)
```

Handle incoming requests in a loop. Supports both `GET` and `POST`.

```blocks
forever(function () {
    if (esp8266.handleWebRequest(100)) {
        basic.showString(esp8266.lastWebRequestMethod())
    }
})
```

Read the last request details.

```blocks
let method = esp8266.lastWebRequestMethod()
let path = esp8266.lastWebRequestPath()
let body = esp8266.lastWebRequestBody()
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

## Use Case: Web App -> ESP8266 -> micro:bit

This extension can run a lightweight HTTP server on ESP8266 to receive `GET` and `POST` from a web app.

Typical use case:
- Web dashboard sends command to local device
- micro:bit reads method/path/body and triggers hardware action
- ESP8266 returns customizable response text and HTTP status code

Attribution: This extension is developed by **Cytron Technologies Sdn Bhd** and maintained by contributors in this repository.

## License

MIT

## Supported targets

* for PXT/microbit
