/*******************************************************************************
 * Functions for Web API
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

// Web API server.
const WEB_API_URL = "backend.whalo8040.workers.dev"

namespace esp8266 {
    // Flag to indicate whether the Web request was completed successfully.
    let webUpdated = false

    /**
     * Return true if the latest Web request is successful.
     */
    //% subcategory="Web"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_is_web_updated
    //% block="Web request successful"
    export function isWebUpdated(): boolean {
        return webUpdated
    }

    /**
     * Poll latest command from web app.
     * @param apiKey API key for x-api-key header.
     */
    //% subcategory="Web"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_receive_from_web_app
    //% block="Web poll command: API key %apiKey"
    export function receiveFromWebApp(apiKey: string): string {
        let command = "NONE|NONE"

        // Reset the request successful flag.
        webUpdated = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return command

        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + WEB_API_URL + "\",443", "OK", 10000) == false) return command

        let endpoint = "/api/microbit/receiveFromWebApp"
        let data = "GET " + endpoint + " HTTP/1.1\r\n"
        data += "Host: " + WEB_API_URL + "\r\n"
        data += "x-api-key: " + apiKey + "\r\n"

        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
        sendCommand(data)

        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return command
        }

        if (getResponse("HTTP/1.1", 5000).includes("200") == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return command
        }

        while (true) {
            let response = getResponse("", 200)
            if (response == "") {
                break
            }

            if (response.includes("|") && !response.includes("HTTP/")) {
                command = response
            }
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        webUpdated = true
        return command
    }

    /**
     * Push sensor value to web app.
     * @param apiKey API key for x-api-key header.
     * @param pin Pin identifier. eg: POP1
     * @param value Value we want to send.
     */
    //% subcategory="Web"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_send_to_web_app
    //% block="Web send value: API key %apiKey Pin %pin Value %value"
    export function sendToWebApp(apiKey: string, pin: string, value: string) {
        // Reset the request successful flag.
        webUpdated = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return

        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + WEB_API_URL + "\",443", "OK", 10000) == false) return

        let endpoint = "/api/microbit/sendToWebApp?pin=" + formatUrl(pin) + "&value=" + formatUrl(value)
        let data = "GET " + endpoint + " HTTP/1.1\r\n"
        data += "Host: " + WEB_API_URL + "\r\n"
        data += "x-api-key: " + apiKey + "\r\n"

        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
        sendCommand(data)

        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        if (getResponse("HTTP/1.1", 5000).includes("200") == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        webUpdated = true
        return
    }
}
