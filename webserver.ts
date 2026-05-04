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
    // Debug buffer for latest raw response captured from ESP8266.
    let webLastRawResponse = ""
    let webLastHttpStatus = ""
    let webLastDebugStep = "IDLE"
    let webLastDebugCode = 0

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
     * Return the latest raw response captured from receiveFromWebApp.
     */
    //% subcategory="Web"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_get_web_last_raw_response
    //% block="Web last raw response"
    export function getWebLastRawResponse(): string {
        return webLastRawResponse
    }

    /**
     * Return the latest HTTP status line captured from receiveFromWebApp.
     */
    //% subcategory="Web"
    //% weight=26
    //% blockGap=8
    //% blockId=esp8266_get_web_last_http_status
    //% block="Web last HTTP status"
    export function getWebLastHttpStatus(): string {
        return webLastHttpStatus
    }

    /**
     * Return the latest debug step for Web polling.
     */
    //% subcategory="Web"
    //% weight=25
    //% blockGap=8
    //% blockId=esp8266_get_web_last_debug_step
    //% block="Web last debug step"
    export function getWebLastDebugStep(): string {
        return webLastDebugStep
    }

    /**
     * Return the latest numeric debug code for Web polling.
     */
    //% subcategory="Web"
    //% weight=24
    //% blockGap=8
    //% blockId=esp8266_get_web_last_debug_code
    //% block="Web last debug code"
    export function getWebLastDebugCode(): number {
        return webLastDebugCode
    }

    /**
     * Poll latest command from web app.
     * @param apiKey API key for x-api-key header.
     * @param pin Pin identifier to poll. eg: motor1
     */
    //% subcategory="Web"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_receive_from_web_app
    //% block="Web poll command: API key %apiKey Pin %pin"
    export function receiveFromWebApp(apiKey: string, pin: string): string {
        let action = "NONE"

        // Reset the request successful flag.
        webUpdated = false
        webLastRawResponse = ""
        webLastHttpStatus = ""
        webLastDebugStep = "START"
        webLastDebugCode = 1

        if (sendCommand("AT+CIPSTART=\"TCP\",\"" + WEB_API_URL + "\",80", "OK", 10000) == false) {
            webLastDebugStep = "CIPSTART_FAIL"
            webLastDebugCode = 2
            return action
        }
        webLastDebugStep = "CIPSTART_OK"
        webLastDebugCode = 3

        let endpoint = "/api/microbit/receiveFromWebApp?pin=" + formatUrl(pin)
        let data = "GET " + endpoint + " HTTP/1.1\r\n"
        data += "Host: " + WEB_API_URL + "\r\n"
        data += "accept: text/plain\r\n"
        data += "x-api-key: " + apiKey + "\r\n"
        data += "\r\n"

        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
        sendCommand(data)
        webLastDebugStep = "REQUEST_SENT"
        webLastDebugCode = 4

        if (getResponse("SEND OK", 5000) == "") {
            webLastDebugStep = "SEND_FAIL"
            webLastDebugCode = 5
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return action
        }
        webLastDebugStep = "SEND_OK"
        webLastDebugCode = 6

        webLastHttpStatus = getResponse("HTTP/1.1", 5000)
        if (webLastHttpStatus.includes("200") == false) {
            webLastDebugStep = "HTTP_NOT_200"
            webLastDebugCode = 7
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return action
        }
        webLastDebugStep = "HTTP_200"
        webLastDebugCode = 8

        // Collect remaining response chunks and parse body deterministically.
        let rawResponse = ""
        let timestamp = input.runningTime()
        while (input.runningTime() - timestamp < 2000) {
            let response = getResponse("", 200)
            if (response == "") {
                continue
            }
            rawResponse += response + "\r\n"
        }
        webLastRawResponse = rawResponse

        let candidate = ""
        if (rawResponse.includes("\r\n\r\n")) {
            candidate = rawResponse.slice(rawResponse.indexOf("\r\n\r\n") + 4)
        } else if (rawResponse.includes("+IPD,") && rawResponse.includes(":")) {
            candidate = rawResponse.slice(rawResponse.indexOf(":") + 1)
        }

        if (candidate.includes("\r\n")) {
            candidate = candidate.slice(0, candidate.indexOf("\r\n"))
        }

        candidate = candidate.trim()
        if (candidate != "") {
            action = candidate
        }
        webLastDebugStep = "PARSED_" + action
        webLastDebugCode = 9

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        webUpdated = true
        webLastDebugStep = "DONE"
        webLastDebugCode = 10
        return action
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

        if (sendCommand("AT+CIPSTART=\"TCP\",\"" + WEB_API_URL + "\",80", "OK", 10000) == false) return

        let endpoint = "/api/microbit/sendToWebApp?pin=" + formatUrl(pin) + "&value=" + formatUrl(value)
        let data = "GET " + endpoint + " HTTP/1.1\r\n"
        data += "Host: " + WEB_API_URL + "\r\n"
        data += "x-api-key: " + apiKey + "\r\n"
        data += "\r\n"

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
